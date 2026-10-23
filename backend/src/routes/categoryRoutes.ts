import { Router } from 'express';
import { getCategories, createCategory, updateCategory } from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getCategories);
router.post('/', authenticate, authorize('ADMIN'), createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), updateCategory);

export default router;
