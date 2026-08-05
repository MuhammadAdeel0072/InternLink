import express from 'express';
import {
  getNotifications,
  getUnreadNotifications,
  getNotificationById,
  createNotificationController,
  markAsRead,
  markAllAsRead,
  markBulkAsRead,
  deleteNotification,
  deleteReadNotifications,
  bulkDeleteNotifications,
  getNotificationStatsController,
  getPreferences,
  updatePreferences
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread', protect, getUnreadNotifications);
router.get('/stats', protect, getNotificationStatsController);
router.get('/preferences', protect, getPreferences);
router.post('/', protect, createNotificationController);
router.put('/preferences', protect, updatePreferences);
router.put('/read-all', protect, markAllAsRead);
router.put('/read-bulk', protect, markBulkAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/read', protect, deleteReadNotifications);
router.delete('/bulk', protect, bulkDeleteNotifications);
router.get('/:id', protect, getNotificationById);

export default router;
