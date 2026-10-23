import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  addInternalNote,
  deleteTicket
} from '../controllers/ticketController';
import { getMessages, createMessage } from '../controllers/messageController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicketStatus);
router.delete('/:id', authorize('ADMIN'), deleteTicket);

router.put('/:id/assign', authorize('ADMIN', 'AGENT'), assignTicket);
router.post('/:id/notes', authorize('ADMIN', 'AGENT'), addInternalNote);

// Nested messages
router.get('/:id/messages', getMessages);
router.post('/:id/messages', createMessage);

export default router;
