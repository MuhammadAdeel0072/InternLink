import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import {
  getOrCreateConversation,
  buildConversationPayload,
  buildMessagePayload,
  sendMessageNotification,
  checkMuteStatus,
  validateFileUpload,
  getFileType
} from '../services/messageService.js';

const MAX_MESSAGE_LENGTH = 5000;
const userRoom = (userId) => `user:${userId.toString()}`;

const emitToParticipant = (io, participantId, event, payload) => {
  if (io && participantId) io.to(userRoom(participantId)).emit(event, payload);
};

const getConversationForParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || !conversation.participants.some((participant) => participant.toString() === userId.toString())) {
    return null;
  }
  return conversation;
};

// @desc    Start or retrieve a conversation thread between two users
// @route   POST /api/messages/conversation/:recipientId
// @access  Private
export const startConversation = async (req, res) => {
  try {
    const recipientId = req.params.recipientId;
    const userId = req.user._id;

    const conversation = await getOrCreateConversation(userId, recipientId);
    const populated = await conversation.populate('participants', 'name email role');
    const payload = await buildConversationPayload(populated, userId);

    res.status(200).json(payload);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user's conversations list
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { filter = 'all', search = '' } = req.query;

    let query = { participants: userId, deletedBy: { $ne: userId } };

    if (filter === 'unread') {
      query = {
        participants: userId,
        deletedBy: { $ne: userId },
        archivedBy: { $ne: userId },
        isArchived: { $ne: true }
      };
    } else if (filter === 'archived') {
      query = {
        participants: userId,
        deletedBy: { $ne: userId },
        $or: [{ archivedBy: userId }, { isArchived: true }]
      };
    } else if (filter === 'pinned') {
      query = {
        participants: userId,
        deletedBy: { $ne: userId },
        $or: [{ pinnedBy: userId }, { isPinned: true }]
      };
    } else {
      query = {
        participants: userId,
        deletedBy: { $ne: userId },
        archivedBy: { $ne: userId },
        isArchived: { $ne: true }
      };
    }

    let conversations = await Conversation.find(query)
      .populate('participants', 'name email role')
      .sort({ updatedAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      conversations = conversations.filter((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );
        if (!otherUser) return false;
        return (
          otherUser.name?.toLowerCase().includes(searchLower) ||
          otherUser.email?.toLowerCase().includes(searchLower) ||
          conv.lastMessage?.toLowerCase().includes(searchLower)
        );
      });
    }

    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const payload = await buildConversationPayload(conv, userId);
        if (!payload) return null;
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          status: { $in: ['sent', 'delivered'] },
          deletedFor: { $ne: userId }
        });
        payload.unreadCount = unreadCount;
        return payload;
      })
    );

    const visibleConversations = formatted.filter(Boolean);
    res.status(200).json(
      filter === 'unread'
        ? visibleConversations.filter((conversation) => conversation.unreadCount > 0)
        : visibleConversations
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages inside a conversation thread
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(401).json({ message: 'Not authorized to view these messages' });
    }

    const parsedLimit = parseInt(limit, 10) || 50;
    const fetchLimit = parsedLimit + 1;

    let query = {
      conversation: req.params.conversationId,
      $nor: [{ deletedFor: req.user._id }]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Scalable database query using indexes: sort descending, limit, then reverse
    const rawMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .populate('sender', 'name email');

    const hasMore = rawMessages.length > parsedLimit;
    const paginatedMessages = hasMore ? rawMessages.slice(0, parsedLimit) : rawMessages;
    const chronologicalMessages = paginatedMessages.reverse();

    // Loading a thread means the recipient's client has actually received the
    // persisted messages. This is a delivery receipt, not a read receipt.
    const deliveredMessages = await Message.find({
      conversation: req.params.conversationId,
      sender: { $ne: req.user._id },
      status: 'sent'
    }).select('_id');
    const deliveredIds = deliveredMessages.map((message) => message._id);

    if (deliveredIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: deliveredIds } },
        { status: 'delivered', deliveredAt: new Date() }
      );
      rawMessages.forEach((message) => {
        if (deliveredIds.some((id) => id.equals(message._id))) message.status = 'delivered';
      });
    }

    const formatted = await Promise.all(
      chronologicalMessages.map((msg) => buildMessagePayload(msg, req.user._id))
    );

    if (deliveredIds.length > 0) {
      const senderId = conversation.participants.find(
        (p) => p.toString() !== req.user._id.toString()
      );
      if (senderId) {
        emitToParticipant(req.io, senderId, 'message:delivered', {
          conversationId: req.params.conversationId,
          messageIds: deliveredIds,
          status: 'delivered'
        });
      }
    }

    const unreadCount = await Message.countDocuments({
      conversation: req.params.conversationId,
      sender: { $ne: req.user._id },
      status: { $in: ['sent', 'delivered'] },
      deletedFor: { $ne: req.user._id }
    });

    res.status(200).json({
      messages: formatted.filter(Boolean),
      hasMore,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages/:conversationId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { text, clientMessageId } = req.body;
    const conversationId = req.params.conversationId;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(401).json({ message: 'Not authorized to post to this conversation' });
    }

    if (checkMuteStatus(conversation, userId)) {
      return res.status(403).json({ message: 'This conversation is muted' });
    }

    // Determine the other participant (receiver)
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    );

    const normalizedClientMessageId = typeof clientMessageId === 'string'
      ? clientMessageId.trim()
      : '';
    if (normalizedClientMessageId.length > 100) {
      return res.status(400).json({ message: 'Invalid message identifier' });
    }

    // A timed-out request may already have committed. Return that persisted
    // message instead of creating a duplicate on retry.
    if (normalizedClientMessageId) {
      const existing = await Message.findOne({
        sender: userId,
        clientMessageId: normalizedClientMessageId
      }).populate('sender', 'name email');
      if (existing) {
        if (existing.conversation.toString() !== conversationId) {
          return res.status(409).json({ message: 'Message identifier conflicts with another conversation' });
        }
        return res.status(200).json(await buildMessagePayload(existing, userId));
      }
    }

    let attachments = [];
    let messageType = 'text';

    if (req.file) {
      validateFileUpload(req.file);
      const fileType = getFileType(req.file.mimetype);
      const attachmentUrl = await uploadToCloudinary(req.file);
      attachments = [{
        url: attachmentUrl,
        type: fileType,
        name: req.file.originalname,
        size: req.file.size
      }];
      messageType = fileType;
    }

    const trimmedText = typeof text === 'string' ? text.trim() : '';

    if (!trimmedText && attachments.length === 0) {
      return res.status(400).json({ message: 'Message text or attachment is required' });
    }
    if (trimmedText.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters` });
    }

    let replyTo = null;
    if (req.body.replyTo) {
      let parsed;
      try {
        parsed = typeof req.body.replyTo === 'string' ? JSON.parse(req.body.replyTo) : req.body.replyTo;
      } catch {
        return res.status(400).json({ message: 'Invalid reply reference' });
      }
      const targetMsgId = parsed?._id || parsed?.messageId;
      if (!targetMsgId) {
        return res.status(400).json({ message: 'Invalid reply reference' });
      }
      const origMsg = await Message.findOne({ _id: targetMsgId, conversation: conversationId })
        .populate('sender', 'name');
      if (!origMsg) {
        return res.status(400).json({ message: 'The message being replied to is unavailable' });
      }
      replyTo = {
        messageId: origMsg._id,
        text: origMsg.message || (origMsg.attachments?.length ? '[Attachment]' : ''),
        senderName: origMsg.sender?.name || 'Unknown',
        senderId: origMsg.sender?._id || origMsg.sender
      };
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      receiverId,
      clientMessageId: normalizedClientMessageId || undefined,
      message: trimmedText || '',
      messageType,
      attachments,
      replyTo,
      status: 'sent'
    });

    conversation.lastMessage = trimmedText || (messageType === 'image' ? '[Image]' : messageType === 'resume' ? '[Resume]' : '[Attachment]');
    conversation.lastMessageAt = new Date();
    // A new incoming message restores only the recipient's archived view.
    conversation.archivedBy = (conversation.archivedBy || []).filter(
      (participant) => participant.toString() !== receiverId.toString()
    );
    conversation.deletedBy = (conversation.deletedBy || []).filter(
      (participant) => participant.toString() !== receiverId.toString()
    );
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email');
    const payload = await buildMessagePayload(populatedMessage, userId);

    const recipientPayload = await buildMessagePayload(populatedMessage, receiverId);
    emitToParticipant(req.io, receiverId, 'message:new', {
      conversationId,
      message: recipientPayload,
      senderId: userId
    });
    emitToParticipant(req.io, receiverId, 'conversation:update', {
      conversationId,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt
    });

    // Persist a notification, but don't let notification failure roll back a
    // message that has already been safely stored.
    void sendMessageNotification({
      senderId: userId,
      recipientId: receiverId,
      conversationId,
      messagePreview: conversation.lastMessage,
      io: req.io,
      userSocketMap: req.userSocketMap
    });

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const filterQuery = {
      conversation: conversationId,
      sender: { $ne: userId },
      status: { $in: ['sent', 'delivered'] }
    };

    if (Array.isArray(messageIds) && messageIds.length > 0) {
      filterQuery._id = { $in: messageIds };
    }

    const unreadMessages = await Message.find(filterQuery).select('_id');
    const readMessageIds = unreadMessages.map((message) => message._id);

    if (readMessageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: readMessageIds } },
        { status: 'read', readAt: new Date() }
      );
    }

    const otherUser = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    );

    if (otherUser && readMessageIds.length > 0) {
      emitToParticipant(req.io, otherUser, 'message:seen', {
        conversationId,
        messageIds: readMessageIds
      });
    }

    res.status(200).json({
      success: true,
      updated: readMessageIds.length,
      messageIds: readMessageIds,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/messages/:id
// @access  Private
export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message: newMessage } = req.body;
    const userId = req.user._id;

    const msg = await Message.findById(id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (msg.sender.toString() !== userId.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this message' });
    }

    if (!await getConversationForParticipant(msg.conversation, userId)) {
      return res.status(401).json({ message: 'Not authorized to edit this message' });
    }

    if (msg.deleted) {
      return res.status(400).json({ message: 'Cannot edit deleted message' });
    }

    const timeDiff = (new Date() - new Date(msg.createdAt)) / (1000 * 60);
    if (timeDiff > 15) {
      return res.status(400).json({ message: 'Message can only be edited within 15 minutes' });
    }

    const trimmedMessage = typeof newMessage === 'string' ? newMessage.trim() : '';
    if (!trimmedMessage || trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: 'Edited message must contain up to 5000 characters' });
    }
    msg.message = trimmedMessage;
    msg.edited = true;
    msg.editedAt = new Date();
    await msg.save();

    const populated = await Message.findById(msg._id).populate('sender', 'name email');
    const payload = await buildMessagePayload(populated, userId);

    emitToParticipant(req.io, msg.receiverId, 'message:edit', {
      messageId: msg._id,
      message: msg.message,
      edited: true,
      editedAt: msg.editedAt
    });

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = req.user._id;

    const msg = await Message.findById(id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!await getConversationForParticipant(msg.conversation, userId)) {
      return res.status(401).json({ message: 'Not authorized to delete this message' });
    }

    if (msg.sender.toString() !== userId.toString() && !deleteForEveryone) {
      return res.status(401).json({ message: 'Not authorized to delete this message' });
    }

    if (deleteForEveryone) {
      if (msg.sender.toString() !== userId.toString()) {
        return res.status(401).json({ message: 'Only sender can delete for everyone' });
      }

      const timeDiff = (new Date() - new Date(msg.createdAt)) / (1000 * 60);
      if (timeDiff > 15) {
        return res.status(400).json({ message: 'Message can only be deleted for everyone within 15 minutes' });
      }

      msg.deleted = true;
      msg.message = 'This message was deleted';
      msg.attachments = [];
      await msg.save();
    } else {
      if (!msg.deletedFor.some((d) => d.toString() === userId.toString())) {
        msg.deletedFor.push(userId);
        await msg.save();
      }
    }

    if (deleteForEveryone) {
      emitToParticipant(req.io, msg.receiverId, 'message:delete', {
        messageId: msg._id,
        deleted: true,
        message: msg.message,
        attachments: []
      });
    }

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    React to a message
// @route   PUT /api/messages/:id/react
// @access  Private
export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const msg = await Message.findById(id);
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!await getConversationForParticipant(msg.conversation, userId)) {
      return res.status(401).json({ message: 'Not authorized to react to this message' });
    }

    if (typeof emoji !== 'string' || emoji.length === 0 || emoji.length > 16) {
      return res.status(400).json({ message: 'Invalid reaction' });
    }

    const existingReaction = msg.reactions.find(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      msg.reactions = msg.reactions.filter(
        (r) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
      );
    } else {
      msg.reactions = msg.reactions.filter(
        (r) => !(r.userId.toString() === userId.toString())
      );
      msg.reactions.push({ userId, emoji });
    }

    await msg.save();
    const populated = await Message.findById(msg._id).populate('sender', 'name email');
    const payload = await buildMessagePayload(populated, userId);

    const recipientId = msg.sender.toString() === userId.toString() ? msg.receiverId : msg.sender;
    emitToParticipant(req.io, recipientId, 'message:reaction', {
      messageId: msg._id,
      reactions: msg.reactions
    });

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a message
// @route   PUT /api/messages/:id/reply
// @access  Private
export const replyToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message: replyText } = req.body;
    const userId = req.user._id;

    const originalMsg = await Message.findById(id).populate('sender', 'name email');
    if (!originalMsg) {
      return res.status(404).json({ message: 'Original message not found' });
    }

    const conversation = await getConversationForParticipant(originalMsg.conversation, userId);
    if (!conversation) {
      return res.status(401).json({ message: 'Not authorized to reply to this message' });
    }

    const trimmedReply = typeof replyText === 'string' ? replyText.trim() : '';
    if (!trimmedReply || trimmedReply.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: 'Reply must contain up to 5000 characters' });
    }

    const receiverId = conversation.participants.find(
      (participant) => participant.toString() !== userId.toString()
    );

    const reply = await Message.create({
      conversation: originalMsg.conversation,
      sender: userId,
      receiverId,
      message: trimmedReply,
      messageType: 'text',
      replyTo: {
        messageId: originalMsg._id,
        text: originalMsg.message,
        senderName: originalMsg.sender.name,
        senderId: originalMsg.sender._id
      },
      status: 'sent'
    });

    conversation.lastMessage = trimmedReply;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Message.findById(reply._id).populate('sender', 'name email');
    const payload = await buildMessagePayload(populated, userId);

    const recipientPayload = await buildMessagePayload(populated, receiverId);
    emitToParticipant(req.io, receiverId, 'message:new', {
      conversationId: conversation._id,
      message: recipientPayload,
      senderId: userId
    });

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive conversation
// @route   PUT /api/messages/archive/:conversationId
// @access  Private
export const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!conversation.archivedBy) conversation.archivedBy = [];
    const userIdStr = userId.toString();
    const isArchived = conversation.archivedBy.some((id) => id.toString() === userIdStr);

    if (isArchived) {
      conversation.archivedBy = conversation.archivedBy.filter((id) => id.toString() !== userIdStr);
    } else {
      conversation.archivedBy.push(userId);
    }

    await conversation.save();
    res.status(200).json({ success: true, isArchived: !isArchived });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pin conversation
// @route   PUT /api/messages/pin/:conversationId
// @access  Private
export const pinConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!conversation.pinnedBy) conversation.pinnedBy = [];
    const userIdStr = userId.toString();
    const isPinned = conversation.pinnedBy.some((id) => id.toString() === userIdStr);

    if (isPinned) {
      conversation.pinnedBy = conversation.pinnedBy.filter((id) => id.toString() !== userIdStr);
    } else {
      conversation.pinnedBy.push(userId);
    }

    await conversation.save();
    res.status(200).json({ success: true, isPinned: !isPinned });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mute conversation
// @route   PUT /api/messages/mute/:conversationId
// @access  Private
export const muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { duration = 'forever' } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!conversation.mutedBy) conversation.mutedBy = [];
    const userIdStr = userId.toString();
    const isMuted = conversation.mutedBy.some((id) => id.toString() === userIdStr);

    let mutedUntil = null;
    if (!isMuted && duration !== 'forever') {
      const now = new Date();
      const durations = {
        '1h': 60 * 60 * 1000,
        '8h': 8 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };
      mutedUntil = new Date(now.getTime() + (durations[duration] || 0));
    }

    if (isMuted) {
      conversation.mutedBy = conversation.mutedBy.filter((id) => id.toString() !== userIdStr);
      conversation.mutedUntil = null;
    } else {
      conversation.mutedBy.push(userId);
      conversation.mutedUntil = mutedUntil;
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      isMuted: !isMuted,
      mutedUntil: conversation.mutedUntil
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload file
// @route   POST /api/messages/upload
// @access  Private
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    validateFileUpload(req.file);
    const fileType = getFileType(req.file.mimetype);
    const url = await uploadToCloudinary(req.file);

    res.status(200).json({
      url,
      type: fileType,
      name: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search messages
// @route   GET /api/messages
// @access  Private
export const searchMessages = async (req, res) => {
  try {
    const { q, conversationId } = req.query;
    const userId = req.user._id;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    let conversationIds = [];
    if (conversationId) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
        deletedBy: { $ne: userId }
      }).select('_id');
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      conversationIds = [conversation._id];
    } else {
      const userConversations = await Conversation.find({ participants: userId }).select('_id');
      conversationIds = userConversations.map((c) => c._id);
    }

    const messages = await Message.find({
      conversation: { $in: conversationIds },
      message: { $regex: q, $options: 'i' },
      $nor: [{ deletedFor: userId }]
    })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = await Promise.all(
      messages.map((msg) => buildMessagePayload(msg, userId))
    );

    res.status(200).json(formatted.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/messages/:conversationId
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Message.updateMany(
      { conversation: conversationId },
      { $addToSet: { deletedFor: userId } }
    );

    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { deletedBy: userId }
    });

    res.status(200).json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
