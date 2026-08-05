import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';

/**
 * Creates a notification and emits it via Socket.IO.
 */
export const createNotification = async ({
  recipientId,
  senderId,
  title,
  message,
  type,
  category,
  priority = 'medium',
  entityId,
  entityType,
  metadata = {},
  io,
  userSocketMap
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      title,
      message,
      type,
      category,
      priority,
      entityId,
      entityType,
      metadata
    });

    const populated = await notification
      .populate('sender', 'name email')
      .populate('recipient', 'name email');

    const senderProfile = await Profile.findOne({ user: senderId }).select('avatar');
    const recipientProfile = await Profile.findOne({ user: recipientId }).select('avatar pushEnabled');

    const payload = {
      _id: notification._id,
      recipient: populated.recipient,
      sender: populated.sender,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      category: notification.category,
      priority: notification.priority,
      entityId: notification.entityId,
      entityType: notification.entityType,
      isRead: notification.isRead,
      isDeleted: notification.isDeleted,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      senderAvatar: senderProfile?.avatar || '',
      recipientAvatar: recipientProfile?.avatar || ''
    };

    if (io && userSocketMap) {
      const recipientSocketId = userSocketMap.get(recipientId?.toString());
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('notification:new', payload);
      }
    }

    return payload;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

export const getNotificationStats = async (userId) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const [total, unread, readToday, thisWeek] = await Promise.all([
      Notification.countDocuments({ recipient: userId, isDeleted: false }),
      Notification.countDocuments({ recipient: userId, isRead: false, isDeleted: false }),
      Notification.countDocuments({
        recipient: userId,
        isRead: true,
        isDeleted: false,
        updatedAt: { $gte: startOfToday }
      }),
      Notification.countDocuments({
        recipient: userId,
        isDeleted: false,
        createdAt: { $gte: startOfWeek }
      })
    ]);

    return { total, unread, readToday, thisWeek };
  } catch (error) {
    console.error('Failed to get notification stats:', error);
    return { total: 0, unread: 0, readToday: 0, thisWeek: 0 };
  }
};

export const getUserPreferences = async (userId) => {
  const user = await User.findById(userId).select('notificationPreferences');
  return user?.notificationPreferences || {
    email: true,
    inApp: true,
    push: false,
    categories: {
      system: true,
      network: true,
      message: true,
      job: true,
      application: true,
      interview: true,
      offer: true,
      hiring: true,
      company: true,
      post: true,
      security: true
    }
  };
};

export const updateUserPreferences = async (userId, preferences) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { notificationPreferences: preferences },
    { new: true }
  ).select('notificationPreferences');
  return user?.notificationPreferences || preferences;
};
