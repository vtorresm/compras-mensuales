import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Esquemas de validación
const createBudgetSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mes inválido (YYYY-MM)').transform(str => new Date(str + '-01')),
  montoLimite: z.number().positive('El monto límite debe ser positivo'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
});

const updateBudgetSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mes inválido (YYYY-MM)').transform(str => new Date(str + '-01')).optional(),
  montoLimite: z.number().positive('El monto límite debe ser positivo').optional(),
  categoryId: z.string().min(1, 'La categoría es requerida').optional(),
});

const getBudgetsQuerySchema = z.object({
  page: z.string().transform(Number).refine(n => n > 0).optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100).optional(),
  mes: z.string().regex(/^\d{4}-\d{2}$/).transform(str => new Date(str + '-01')).optional(),
  categoria: z.string().optional(),
});

// Crear presupuesto
export const createBudget = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validatedData = createBudgetSchema.parse(req.body);
    const { mes, montoLimite, categoryId } = validatedData;

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

    // Verificar que no existe presupuesto para esta categoría y mes
    const existingBudget = await prisma.budget.findFirst({
      where: {
        categoryId,
        userId,
        mes,
      },
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un presupuesto para esta categoría en este mes',
      });
    }

    const budget = await prisma.budget.create({
      data: {
        mes,
        montoLimite,
        categoryId,
        userId,
      },
      include: { category: true },
    });

    res.status(201).json({
      success: true,
      message: 'Presupuesto creado exitosamente',
      data: { budget },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    console.error('Error creando presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Obtener presupuestos con filtros y paginación
export const getBudgets = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const query = getBudgetsQuerySchema.parse(req.query);
    const { page = 1, limit = 10, mes, categoria } = query;

    const where: any = { userId };

    if (mes) where.mes = mes;
    if (categoria) where.categoryId = categoria;

    const skip = (page - 1) * limit;

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: { category: true },
        orderBy: { mes: 'desc' },
        skip,
        take: limit,
      }),
      prisma.budget.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        budgets,
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

    console.error('Error obteniendo presupuestos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Obtener presupuesto por ID
export const getBudgetById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado',
      });
    }

    res.json({
      success: true,
      data: { budget },
    });
  } catch (error) {
    console.error('Error obteniendo presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Actualizar presupuesto
export const updateBudget = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const validatedData = updateBudgetSchema.parse(req.body);

    // Verificar que existe y pertenece al usuario
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existingBudget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado',
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

    // Si cambia mes o categoryId, verificar unicidad
    if (validatedData.mes || validatedData.categoryId) {
      const newMes = validatedData.mes || existingBudget.mes;
      const newCategoryId = validatedData.categoryId || existingBudget.categoryId;

      const duplicate = await prisma.budget.findFirst({
        where: {
          categoryId: newCategoryId,
          userId,
          mes: newMes,
          id: { not: id }, // Excluir el actual
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un presupuesto para esta categoría en este mes',
        });
      }
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: validatedData,
      include: { category: true },
    });

    res.json({
      success: true,
      message: 'Presupuesto actualizado exitosamente',
      data: { budget },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.issues,
      });
    }

    console.error('Error actualizando presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

// Eliminar presupuesto
export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado',
      });
    }

    await prisma.budget.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Presupuesto eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error eliminando presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};