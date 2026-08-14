import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { createNotification } from './notificationService.js';

export const getOrCreateConversation = async (userId, recipientId) => {
  if (userId.toString() === recipientId.toString()) {
    throw new Error('You cannot chat with yourself');
  }

  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new Error('Recipient not found');
  }

  const currentUser = await User.findById(userId);
  if (!currentUser.preferences?.privacy?.allowMessages && currentUser.preferences?.privacy?.allowMessages !== undefined) {
    if (!currentUser.preferences.privacy.allowMessages) {
      throw new Error('This user has disabled direct messages');
    }
  }

  const blockedUsers = currentUser.preferences?.privacy?.blockedUsers || [];
  if (blockedUsers.some((id) => id.toString() === recipientId.toString())) {
    throw new Error('You have blocked this user');
  }

  const recipientBlocked = recipient.preferences?.privacy?.blockedUsers || [];
  if (recipientBlocked.some((id) => id.toString() === userId.toString())) {
    throw new Error('You cannot message this user');
  }

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, recipientId], $size: 2 }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, recipientId],
      lastMessage: 'Conversation started',
      lastMessageAt: new Date()
    });
  }

  return await conversation.populate('participants', 'name email role');
};

export const buildConversationPayload = async (conversation, currentUserId) => {
  const otherUser = conversation.participants.find(
    (p) => p._id.toString() !== currentUserId.toString()
  );

  if (!otherUser) return null;

  const otherProfile = await Profile.findOne({ user: otherUser._id }).select('avatar headline currentStatus');
  const otherUserFull = await User.findById(otherUser._id).select('name email role');

  const userIdStr = currentUserId.toString();
  const isPinned = Boolean(
    (conversation.pinnedBy && conversation.pinnedBy.some((id) => id.toString() === userIdStr)) ||
    conversation.isPinned
  );
  const isArchived = Boolean(
    (conversation.archivedBy && conversation.archivedBy.some((id) => id.toString() === userIdStr)) ||
    conversation.isArchived
  );
  const isMuted = Boolean(
    (conversation.mutedBy && conversation.mutedBy.some((id) => id.toString() === userIdStr)) ||
    conversation.isMuted
  );

  return {
    _id: conversation._id,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    isArchived,
    isPinned,
    isMuted,
    mutedUntil: conversation.mutedUntil,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    otherUser: {
      _id: otherUser._id,
      name: otherUserFull?.name || otherUser.name,
      email: otherUserFull?.email || otherUser.email,
      role: otherUserFull?.role || otherUser.role,
      avatar: otherProfile?.avatar || '',
      headline: otherProfile?.headline || '',
      currentStatus: otherProfile?.currentStatus || ''
    }
  };
};

export const buildMessagePayload = async (message, currentUserId) => {
  const isMine = message.sender?._id
    ? message.sender._id.toString() === currentUserId.toString()
    : message.sender?.toString() === currentUserId.toString();
  const isDeletedForMe = message.deletedFor?.some((id) => id.toString() === currentUserId.toString());

  if (isDeletedForMe) return null;

  return {
    _id: message._id,
    conversation: message.conversation,
    sender: message.sender,
    receiverId: message.receiverId,
    message: message.message,
    messageType: message.messageType,
    attachments: message.attachments,
    replyTo: message.replyTo,
    reactions: message.reactions,
    status: message.status,
    edited: message.edited,
    editedAt: message.editedAt,
    deleted: message.deleted,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    isMine
  };
};

export const sendMessageNotification = async ({
  senderId,
  recipientId,
  conversationId,
  messagePreview,
  io,
  userSocketMap
}) => {
  const notificationPayload = {
    recipientId,
    senderId,
    title: 'New Message',
    message: messagePreview,
    type: 'message',
    category: 'message',
    priority: 'medium',
    entityId: conversationId,
    entityType: 'message',
    metadata: { conversationId, preview: messagePreview },
    io,
    userSocketMap
  };

  const notification = await createNotification(notificationPayload);

  if (io && userSocketMap) {
    const recipientSocketId = userSocketMap.get(recipientId?.toString());
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message:new', {
        conversationId,
        message: messagePreview,
        senderId
      });
    }
  }

  return notification;
};

export const checkMuteStatus = (conversation, userId) => {
  const userIdStr = userId ? userId.toString() : null;
  const isMuted = Boolean(
    (userIdStr && conversation.mutedBy && conversation.mutedBy.some((id) => id.toString() === userIdStr)) ||
    conversation.isMuted
  );

  if (!isMuted) return false;
  if (conversation.mutedUntil && new Date() > new Date(conversation.mutedUntil)) {
    return false;
  }
  return true;
};

export const validateFileUpload = (file) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed'
  ];

  const maxSize = 15 * 1024 * 1024;

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only images, PDF, DOCX, and ZIP files are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File size exceeds 15MB limit.');
  }

  return true;
};

export const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'resume';
  return 'document';
};
