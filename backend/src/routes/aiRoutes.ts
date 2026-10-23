import { Router } from 'express';
import { classify } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/classify', authenticate, classify);

export default router;
