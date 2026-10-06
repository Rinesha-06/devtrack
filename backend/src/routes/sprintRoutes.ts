import { Router } from 'express';
import { SprintController } from '../controllers/sprintController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, SprintController.list);
router.get('/:id', authenticate, SprintController.getById);
router.post('/', authenticate, authorize('PROJECT_MANAGER'), SprintController.create);
router.put('/:id', authenticate, authorize('PROJECT_MANAGER'), SprintController.update);
router.delete('/:id', authenticate, authorize('PROJECT_MANAGER'), SprintController.delete);

export default router;
