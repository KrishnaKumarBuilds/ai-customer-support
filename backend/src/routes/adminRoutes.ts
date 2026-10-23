import { Router } from 'express';
import {
  getDashboardStats,
  getAnalytics,
  getUsers,
  updateUserRole,
  deleteUser
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
