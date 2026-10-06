import { Router } from 'express';
import { GitHubController } from '../controllers/githubController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/repository', authenticate, GitHubController.getRepository);
router.get('/commits', authenticate, GitHubController.getCommits);

export default router;
