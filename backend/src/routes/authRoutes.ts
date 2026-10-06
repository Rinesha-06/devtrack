import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticate, AuthController.me);
router.put('/profile', authenticate, AuthController.updateProfile);
router.get('/users', authenticate, AuthController.listUsers);

export default router;
