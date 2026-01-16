import { Router } from 'express';
import { z } from 'zod';
import * as budgetController from '../controllers/budget.controller';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

// Esquemas de validación
const createBudgetSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mes inválido (YYYY-MM)'),
  montoLimite: z.number().positive('El monto límite debe ser positivo'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
});

const updateBudgetSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mes inválido (YYYY-MM)').optional(),
  montoLimite: z.number().positive('El monto límite debe ser positivo').optional(),
  categoryId: z.string().min(1, 'La categoría es requerida').optional(),
});

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas CRUD
router.post('/', validateRequest(createBudgetSchema), budgetController.createBudget);
router.get('/', budgetController.getBudgets);
router.get('/:id', budgetController.getBudgetById);
router.put('/:id', validateRequest(updateBudgetSchema), budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;