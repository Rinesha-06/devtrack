import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, TaskController.list);
router.get('/:id', authenticate, TaskController.getById);
router.post('/', authenticate, TaskController.create);
router.put('/:id', authenticate, TaskController.update);
router.patch('/:id/status', authenticate, TaskController.updateStatus);
router.delete('/:id', authenticate, TaskController.delete);

export default router;
