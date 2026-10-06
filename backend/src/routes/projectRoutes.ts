import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, ProjectController.list);
router.get('/:id', authenticate, ProjectController.getById);
router.post('/', authenticate, authorize('PROJECT_MANAGER'), ProjectController.create);
router.put('/:id', authenticate, authorize('PROJECT_MANAGER'), ProjectController.update);
router.delete('/:id', authenticate, authorize('PROJECT_MANAGER'), ProjectController.delete);
router.post('/:id/members', authenticate, authorize('PROJECT_MANAGER'), ProjectController.addMember);

export default router;
