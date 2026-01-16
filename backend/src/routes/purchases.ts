import { Router } from 'express';
import { z } from 'zod';
import * as purchaseController from '../controllers/purchase.controller';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

// Esquemas de validación
const createPurchaseSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  monto: z.number().positive('El monto debe ser positivo'),
  establecimiento: z.string().min(1, 'El establecimiento es requerido'),
  descripcion: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  items: z.string().optional(),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'transferencia']),
});

const updatePurchaseSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').optional(),
  monto: z.number().positive('El monto debe ser positivo').optional(),
  establecimiento: z.string().min(1, 'El establecimiento es requerido').optional(),
  descripcion: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida').optional(),
  items: z.string().optional(),
  metodoPago: z.enum(['efectivo', 'tarjeta', 'transferencia']).optional(),
});

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas CRUD
router.post('/', validateRequest(createPurchaseSchema), purchaseController.createPurchase);
router.get('/', purchaseController.getPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.put('/:id', validateRequest(updatePurchaseSchema), purchaseController.updatePurchase);
router.delete('/:id', purchaseController.deletePurchase);

export default router;