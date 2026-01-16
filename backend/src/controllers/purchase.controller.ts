import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';

// Esquemas de validación
const createPurchaseSchema = z.object({
  fecha: z.string().transform(str => new Date(str)).refine(date => !isNaN(date.getTime()), 'Fecha inválida'),
  monto: z.number().positive('El monto debe ser positivo'),
  establecimiento: z.string().min(1, 'El establecimiento es requerido'),
  descripcion: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  items: z.string().optional(),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'transferencia']),
});

const updatePurchaseSchema = z.object({
  fecha: z.string().transform(str => new Date(str)).refine(date => !isNaN(date.getTime()), 'Fecha inválida').optional(),
  monto: z.number().positive('El monto debe ser positivo').optional(),
  establecimiento: z.string().min(1, 'El establecimiento es requerido').optional(),
  descripcion: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida').optional(),
  items: z.string().optional(),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
});

const getPurchasesQuerySchema = z.object({
  page: z.string().transform(Number).refine(n => n > 0).optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100).optional(),
  fechaDesde: z.string().transform(str => new Date(str)).refine(date => !isNaN(date.getTime())).optional(),
  fechaHasta: z.string().transform(str => new Date(str)).refine(date => !isNaN(date.getTime())).optional(),
  categoria: z.string().optional(),
  establecimiento: z.string().optional(),
});

// Crear compra
export const createPurchase = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = createPurchaseSchema.parse(req.body);
    const { fecha, monto, establecimiento, descripcion, categoryId, items, metodoPago } = validatedData;

    // Verificar que la categoría existe y pertenece al usuario
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    const purchase = await prisma.purchase.create({
      data: {
        fecha,
        monto,
        establecimiento,
        descripcion,
        categoryId,
        items,
        metodoPago,
        userId,
      },
      include: { category: true },
    });

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente',
      data: { purchase },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    console.error('Error creando compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Obtener compras con filtros y paginación
export const getPurchases = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const query = getPurchasesQuerySchema.parse(req.query);
    const { page = 1, limit = 10, fechaDesde, fechaHasta, categoria, establecimiento } = query;

    const where: any = { userId };

    if (fechaDesde) where.fecha = { ...where.fecha, gte: fechaDesde };
    if (fechaHasta) where.fecha = { ...where.fecha, lte: fechaHasta };
    if (categoria) where.categoryId = categoria;
    if (establecimiento) where.establecimiento = { contains: establecimiento, mode: 'insensitive' };

    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: { category: true },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        purchases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros de consulta inválidos',
        errors: error.issues,
      });
    }

    console.error('Error obteniendo compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Obtener compra por ID
export const getPurchaseById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purchase = await prisma.purchase.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada',
      });
    }

    res.json({
      success: true,
      data: { purchase },
    });
  } catch (error) {
    console.error('Error obteniendo compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Actualizar compra
export const updatePurchase = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const validatedData = updatePurchaseSchema.parse(req.body);

    // Verificar que existe y pertenece al usuario
    const existingPurchase = await prisma.purchase.findFirst({
      where: { id, userId },
    });

    if (!existingPurchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada',
      });
    }

    // Si cambia categoryId, verificar que existe
    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: validatedData.categoryId, userId },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Categoría no encontrada',
        });
      }
    }

    const purchase = await prisma.purchase.update({
      where: { id },
      data: validatedData,
      include: { category: true },
    });

    res.json({
      success: true,
      message: 'Compra actualizada exitosamente',
      data: { purchase },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    console.error('Error actualizando compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Eliminar compra
export const deletePurchase = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const purchase = await prisma.purchase.findFirst({
      where: { id, userId },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada',
      });
    }

    await prisma.purchase.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Compra eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error eliminando compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};