import { Router } from 'express';
import { BugController } from '../controllers/bugController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, BugController.list);
router.get('/:id', authenticate, BugController.getById);
router.post('/', authenticate, BugController.create);
router.put('/:id', authenticate, BugController.update);
router.patch('/:id/status', authenticate, BugController.updateStatus);
router.delete('/:id', authenticate, BugController.delete);

export default router;
