import { Router } from 'express';
import { StoryController } from '../controllers/storyController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, StoryController.list);
router.get('/:id', authenticate, StoryController.getById);
router.post('/', authenticate, authorize('PROJECT_MANAGER'), StoryController.create);
router.put('/:id', authenticate, StoryController.update);
router.delete('/:id', authenticate, authorize('PROJECT_MANAGER'), StoryController.delete);

export default router;
