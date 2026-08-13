import Notification from '../models/Notification.js';
import Profile from '../models/Profile.js';
import {
  getNotificationStats,
  getUserPreferences,
  updateUserPreferences,
  createNotification
} from '../services/notificationService.js';

// @desc    Get unread notification count (lightweight, for header badge)
// @route   GET /api/notifications/unread/count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      isDeleted: false
    });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's notifications with filters
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const { status = 'all', category, search, sort = 'newest', limit = 20, page = 1 } = req.query;
    const userId = req.user._id;

    const query = { recipient: userId, isDeleted: false };

    if (status === 'unread') query.isRead = false;
    else if (status === 'read') query.isRead = true;

    if (category && category !== 'all') query.category = category;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Batch-fetch all sender profiles in one query instead of per-notification N+1
    const senderIds = notifications
      .map(n => n.sender?._id || n.sender)
      .filter(Boolean);

    let profileMap = {};
    if (senderIds.length > 0) {
      const profiles = await Profile.find({ user: { $in: senderIds } })
        .select('user avatar')
        .lean();
      profileMap = Object.fromEntries(
        profiles.filter(p => p.user).map(p => [p.user.toString(), p])
      );
    }

    const formatted = notifications.map((notif) => {
      const senderId = notif.sender?._id || notif.sender;
      const senderIdStr = senderId ? senderId.toString() : null;
      const senderProfile = profileMap[senderIdStr] || {};

      return {
        _id: notif._id,
        recipient: notif.recipient,
        type: notif.type,
        category: notif.category,
        priority: notif.priority,
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        isDeleted: notif.isDeleted,
        entityId: notif.entityId,
        entityType: notif.entityType,
        createdAt: notif.createdAt,
        updatedAt: notif.updatedAt,
        sender: {
          _id: senderIdStr || null,
          name: notif.sender?.name || 'User',
          email: notif.sender?.email || '',
          avatar: senderProfile?.avatar || ''
        }
      };
    });

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread notifications
// @route   GET /api/notifications/unread
// @access  Private
export const getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      isRead: false,
      isDeleted: false
    })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Batch-fetch sender profiles
    const senderIds = notifications
      .map(n => n.sender?._id || n.sender)
      .filter(Boolean);

    let profileMap = {};
    if (senderIds.length > 0) {
      const profiles = await Profile.find({ user: { $in: senderIds } })
        .select('user avatar')
        .lean();
      profileMap = Object.fromEntries(
        profiles.filter(p => p.user).map(p => [p.user.toString(), p])
      );
    }

    const formatted = notifications.map((notif) => {
      const senderId = notif.sender?._id || notif.sender;
      const senderIdStr = senderId ? senderId.toString() : null;
      const senderProfile = profileMap[senderIdStr] || {};

      return {
        _id: notif._id,
        type: notif.type,
        category: notif.category,
        priority: notif.priority,
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        entityId: notif.entityId,
        entityType: notif.entityType,
        createdAt: notif.createdAt,
        sender: {
          _id: senderIdStr || null,
          name: notif.sender?.name || 'User',
          email: notif.sender?.email || '',
          avatar: senderProfile?.avatar || ''
        }
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
export const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sender', 'name email')
      .lean();

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const senderId = notification.sender?._id;
    const senderProfile = senderId
      ? await Profile.findOne({ user: senderId }).select('avatar').lean()
      : null;

    res.status(200).json({
      _id: notification._id,
      type: notification.type,
      category: notification.category,
      priority: notification.priority,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      isDeleted: notification.isDeleted,
      entityId: notification.entityId,
      entityType: notification.entityType,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      sender: {
        _id: senderId?.toString() || null,
        name: notification.sender?.name || 'User',
        email: notification.sender?.email || '',
        avatar: senderProfile?.avatar || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      _id: notification._id,
      isRead: notification.isRead,
      readAt: notification.readAt,
      updatedAt: notification.updatedAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false, isDeleted: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a notification (soft delete)
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    notification.isDeleted = true;
    await notification.save();

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
export const deleteReadNotifications = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: true, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    res.status(200).json({
      message: 'Read notifications deleted',
      deletedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk mark notifications as read
// @route   PUT /api/notifications/read-bulk
// @access  Private
export const markBulkAsRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid notification IDs' });
    }

    const result = await Notification.updateMany(
      { _id: { $in: ids }, recipient: req.user._id, isDeleted: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      message: 'Notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk delete notifications
// @route   DELETE /api/notifications/bulk
// @access  Private
export const bulkDeleteNotifications = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid notification IDs' });
    }

    const result = await Notification.updateMany(
      { _id: { $in: ids }, recipient: req.user._id, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    res.status(200).json({
      message: 'Notifications deleted',
      deletedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notification stats
// @route   GET /api/notifications/stats
// @access  Private
export const getNotificationStatsController = async (req, res) => {
  try {
    const stats = await getNotificationStats(req.user._id);
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
export const getPreferences = async (req, res) => {
  try {
    const preferences = await getUserPreferences(req.user._id);
    res.status(200).json(preferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
export const updatePreferences = async (req, res) => {
  try {
    const preferences = await updateUserPreferences(req.user._id, req.body);
    res.status(200).json(preferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create notification (internal use)
// @route   POST /api/notifications
// @access  Private
export const createNotificationController = async (req, res) => {
  try {
    const { recipientId, senderId, title, message, type, category, priority, entityId, entityType, metadata } = req.body;

    const payload = await createNotification({
      recipientId,
      senderId,
      title,
      message,
      type,
      category,
      priority,
      entityId,
      entityType,
      metadata,
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    if (!payload) {
      return res.status(500).json({ message: 'Failed to create notification' });
    }

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
