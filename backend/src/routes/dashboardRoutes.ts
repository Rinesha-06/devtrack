import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, DashboardController.getStats);
router.get('/activities', authenticate, DashboardController.getActivities);
router.get('/notifications', authenticate, DashboardController.getNotifications);
router.put('/notifications/:id/read', authenticate, DashboardController.markNotificationRead);
router.put('/notifications/read-all', authenticate, DashboardController.markAllNotificationsRead);

export default router;
