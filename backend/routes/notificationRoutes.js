import express from 'express';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
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
router.get('/unread/count', protect, getUnreadCount);
router.get('/stats', protect, getNotificationStatsController);
router.get('/preferences', protect, getPreferences);
router.post('/', protect, createNotificationController);
router.put('/preferences', protect, updatePreferences);
router.put('/read-all', protect, markAllAsRead);
router.put('/read-bulk', protect, markBulkAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/read', protect, deleteReadNotifications);
router.delete('/bulk', protect, bulkDeleteNotifications);
// /:id MUST come AFTER all static keyword routes ('read', 'bulk') to avoid
// Express matching '/read' or '/bulk' as an ObjectId param.
router.delete('/:id', protect, deleteNotification);
router.get('/:id', protect, getNotificationById);

export default router;
