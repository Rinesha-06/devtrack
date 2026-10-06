import { Router } from 'express';
import { CicdController } from '../controllers/cicdController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/builds', authenticate, CicdController.listBuilds);
router.post('/trigger', authenticate, authorize('PROJECT_MANAGER'), CicdController.triggerBuild);

export default router;
