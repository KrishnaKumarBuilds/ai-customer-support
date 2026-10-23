import { Router } from 'express';
import { getSLARules, createSLARule, updateSLARule } from '../controllers/slaController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getSLARules);
router.post('/', authenticate, authorize('ADMIN'), createSLARule);
router.put('/:id', authenticate, authorize('ADMIN'), updateSLARule);

export default router;
