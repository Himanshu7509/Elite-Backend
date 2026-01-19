import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  registerToken,
  broadcastNotification,
  getAllUserTokens
} from '../controllers/notification.controller.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.post('/register-token', registerToken);
router.get('/all-tokens', getAllUserTokens);
router.post('/broadcast', broadcastNotification);

export default router;