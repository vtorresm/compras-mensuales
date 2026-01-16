import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Esquemas de validación
const createCategorySchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  icono: z.string().optional(),
});

const updateCategorySchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  descripcion: z.string().optional(),
  color: z.string().optional(),
  icono: z.string().optional(),
});

// Crear categoría
export const createCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = createCategorySchema.parse(req.body);
    const { nombre, descripcion, color, icono } = validatedData;

    // Verificar si ya existe para el usuario
    const existingCategory = await prisma.category.findFirst({
      where: { nombre, userId },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre',
      });
    }

    const category = await prisma.category.create({
      data: {
        nombre,
        descripcion,
        color: color || '#1976d2',
        icono,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: { category },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Obtener todas las categorías del usuario
export const getCategories = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { nombre: 'asc' },
    });

    res.json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Obtener categoría por ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    res.json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Actualizar categoría
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    // Verificar que existe y pertenece al usuario
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    // Si cambia nombre, verificar unicidad
    if (validatedData.nombre && validatedData.nombre !== existingCategory.nombre) {
      const duplicate = await prisma.category.findFirst({
        where: { nombre: validatedData.nombre, userId },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una categoría con ese nombre',
        });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: { category },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Eliminar categoría
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Verificar que existe y pertenece al usuario
    const category = await prisma.category.findFirst({
      where: { id, userId },
      include: { purchases: true }, // Para verificar si tiene compras
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    if (category.purchases.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene compras asociadas',
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};