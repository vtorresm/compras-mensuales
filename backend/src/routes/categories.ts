import { Router } from 'express';
import { z } from 'zod';
import * as categoryController from '../controllers/category.controller';
import { validateRequest } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

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

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas CRUD
router.post('/', validateRequest(createCategorySchema), categoryController.createCategory);
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', validateRequest(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;