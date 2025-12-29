import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware para validación de datos usando esquemas Zod
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors,
        });
      }
      next(error);
    }
  };
};

/**
 * Esquemas de validación para diferentes entidades
 */
export const userSchemas = {
  register: {
    body: {
      email: (schema: any) => schema.email().min(1, 'El email es requerido'),
      password: (schema: any) => schema.min(6, 'La contraseña debe tener al menos 6 caracteres'),
      nombre: (schema: any) => schema.min(1, 'El nombre es requerido'),
    },
  },
  login: {
    body: {
      email: (schema: any) => schema.email().min(1, 'El email es requerido'),
      password: (schema: any) => schema.min(1, 'La contraseña es requerida'),
    },
  },
};

export const categorySchemas = {
  create: {
    body: {
      nombre: (schema: any) => schema.min(1, 'El nombre es requerido'),
      descripcion: (schema: any) => schema.optional(),
      color: (schema: any) => schema.optional(),
      icono: (schema: any) => schema.optional(),
    },
  },
  update: {
    params: {
      id: (schema: any) => schema.min(1, 'El ID es requerido'),
    },
    body: {
      nombre: (schema: any) => schema.optional(),
      descripcion: (schema: any) => schema.optional(),
      color: (schema: any) => schema.optional(),
      icono: (schema: any) => schema.optional(),
    },
  },
};

export const purchaseSchemas = {
  create: {
    body: {
      fecha: (schema: any) => schema.date('Fecha inválida'),
      monto: (schema: any) => schema.number().positive('El monto debe ser positivo'),
      establecimiento: (schema: any) => schema.min(1, 'El establecimiento es requerido'),
      descripcion: (schema: any) => schema.optional(),
      categoryId: (schema: any) => schema.min(1, 'La categoría es requerida'),
      items: (schema: any) => schema.optional(),
      metodoPago: (schema: any) => schema.enum(['efectivo', 'tarjeta', 'transferencia'], 'Método de pago inválido'),
    },
  },
  update: {
    params: {
      id: (schema: any) => schema.min(1, 'El ID es requerido'),
    },
    body: {
      fecha: (schema: any) => schema.date('Fecha inválida').optional(),
      monto: (schema: any) => schema.number().positive('El monto debe ser positivo').optional(),
      establecimiento: (schema: any) => schema.optional(),
      descripcion: (schema: any) => schema.optional(),
      categoryId: (schema: any) => schema.optional(),
      items: (schema: any) => schema.optional(),
      metodoPago: (schema: any) => schema.enum(['efectivo', 'tarjeta', 'transferencia'], 'Método de pago inválido').optional(),
    },
  },
  getAll: {
    query: {
      page: (schema: any) => schema.number().positive().optional(),
      limit: (schema: any) => schema.number().positive().max(100).optional(),
      fechaDesde: (schema: any) => schema.date('Fecha inválida').optional(),
      fechaHasta: (schema: any) => schema.date('Fecha inválida').optional(),
      categoria: (schema: any) => schema.optional(),
      establecimiento: (schema: any) => schema.optional(),
    },
  },
};