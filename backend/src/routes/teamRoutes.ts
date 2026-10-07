import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, TeamController.list);
router.get('/:id', authenticate, TeamController.getById);
router.post('/', authenticate, authorize('PROJECT_MANAGER'), TeamController.create);
router.put('/:id', authenticate, authorize('PROJECT_MANAGER'), TeamController.update);
router.delete('/:id', authenticate, authorize('PROJECT_MANAGER'), TeamController.delete);
router.post('/:id/members', authenticate, authorize('PROJECT_MANAGER'), TeamController.addMember);
router.put('/:id/members/:userId', authenticate, authorize('PROJECT_MANAGER'), TeamController.updateMember);
router.patch('/:id/members/:userId', authenticate, authorize('PROJECT_MANAGER'), TeamController.updateMember);
router.delete('/:id/members/:userId', authenticate, authorize('PROJECT_MANAGER'), TeamController.removeMember);

export default router;
