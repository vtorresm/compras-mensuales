import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Esquemas de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

const updateProfileSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

// Generar tokens
const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Registro
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    const { email, password, nombre } = validatedData;
    
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }
    
    // Hash de la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        createdAt: true,
      },
    });
    
    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    
    // Guardar refresh token en la base de datos
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }
    
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const { email, password } = validatedData;
    
    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }
    
    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }
    
    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    
    // Guardar refresh token en la base de datos
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }
    
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    
    // Verificar refresh token en la base de datos
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido o expirado',
      });
    }
    
    // Verificar JWT refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    if (decoded.userId !== storedToken.userId) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido',
      });
    }
    
    // Eliminar refresh token usado
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
    
    // Generar nuevos tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(
      storedToken.user.id,
      storedToken.user.email
    );
    
    // Guardar nuevo refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });
    
    res.json({
      success: true,
      message: 'Token actualizado exitosamente',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }
    
    console.error('Error en refresh token:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token inválido',
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    
    res.json({
      success: true,
      message: 'Logout exitoso',
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Perfil de usuario
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }
    
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Cambiar contraseña
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = changePasswordSchema.parse(req.body);

    const { currentPassword, newPassword } = validatedData;

    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta',
      });
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Actualizar perfil
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = updateProfileSchema.parse(req.body);

    const { nombre, email } = validatedData;

    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (email) {
      // Verificar si el email ya está en uso por otro usuario
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso',
        });
      }
      updateData.email = email;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { user },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};