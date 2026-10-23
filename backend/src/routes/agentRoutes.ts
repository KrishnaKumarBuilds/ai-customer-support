import { Router } from 'express';
import { getAgents, getAgentById, updateAgent } from '../controllers/agentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAgents);
router.get('/:id', getAgentById);
router.put('/:id', updateAgent);

export default router;
