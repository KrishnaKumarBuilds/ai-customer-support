import { Router } from 'express';
import { submitFeedback, getFeedback } from '../controllers/feedbackController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', submitFeedback);
router.get('/', getFeedback);

export default router;
