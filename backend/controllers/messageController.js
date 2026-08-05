import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
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

    let query = { participants: userId };

    if (filter === 'unread') {
      query = {
        participants: userId,
        isArchived: { $ne: true }
      };
    } else if (filter === 'archived') {
      query = { participants: userId, isArchived: true };
    } else if (filter === 'pinned') {
      query = { participants: userId, isPinned: true };
    } else {
      query = { participants: userId, isArchived: { $ne: true } };
    }

    let conversations = await Conversation.find(query)
      .populate('participants', 'name email role')
      .sort({ isPinned: -1, updatedAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      conversations = conversations.filter((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== userId.toString()
        );
        if (!otherUser) return false;
        return (
          otherUser.name?.toLowerCase().includes(searchLower) ||
          otherUser.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        return buildConversationPayload(conv, userId);
      })
    );

    res.status(200).json(formatted.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages inside a conversation thread
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(401).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({
      conversation: req.params.conversationId,
      $nor: [{ deletedFor: req.user._id }]
    })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    const formatted = await Promise.all(
      messages.map((msg) => buildMessagePayload(msg, req.user._id))
    );

    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        sender: { $ne: req.user._id },
        status: 'sent'
      },
      {
        status: 'delivered',
        deliveredAt: new Date()
      }
    );

    res.status(200).json(formatted.filter(Boolean));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/messages/:conversationId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const conversationId = req.params.conversationId;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized to post to this conversation' });
    }

    if (checkMuteStatus(conversation)) {
      return res.status(403).json({ message: 'This conversation is muted' });
    }

    const receiverId = conversation.participants.find(
      (p) => p.toString() !== userId.toString()
    );

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

    if (!text && attachments.length === 0) {
      return res.status(400).json({ message: 'Message text or attachment is required' });
    }

    let replyTo = null;
    if (req.body.replyTo) {
      try {
        replyTo = JSON.parse(req.body.replyTo);
      } catch (e) {
        replyTo = null;
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      receiverId,
      message: text || '',
      messageType,
      attachments,
      replyTo,
      status: 'sent'
    });

    conversation.lastMessage = text || (messageType === 'image' ? '[Image]' : messageType === 'resume' ? '[Resume]' : '[Attachment]');
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email');
    const payload = await buildMessagePayload(populatedMessage, userId);

    if (req.io && req.userSocketMap) {
      const recipientSocketId = req.userSocketMap.get(receiverId.toString());
      if (recipientSocketId) {
        const recipientPayload = await buildMessagePayload(populatedMessage, receiverId);
        req.io.to(recipientSocketId).emit('message:new', {
          conversationId,
          message: recipientPayload,
          senderId: userId
        });
        req.io.to(recipientSocketId).emit('conversation:update', {
          conversationId,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt
        });
      }
    }

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

    if (!conversation.participants.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        sender: { $ne: userId },
        status: { $in: ['sent', 'delivered'] }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      updated: result.modifiedCount,
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

    if (msg.deleted) {
      return res.status(400).json({ message: 'Cannot edit deleted message' });
    }

    const timeDiff = (new Date() - new Date(msg.createdAt)) / (1000 * 60);
    if (timeDiff > 15) {
      return res.status(400).json({ message: 'Message can only be edited within 15 minutes' });
    }

    msg.message = newMessage;
    msg.edited = true;
    msg.editedAt = new Date();
    await msg.save();

    const populated = await Message.findById(msg._id).populate('sender', 'name email');
    const payload = await buildMessagePayload(populated, userId);

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
      if (!msg.deletedFor.includes(userId)) {
        msg.deletedFor.push(userId);
        await msg.save();
      }
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

    const reply = await Message.create({
      conversation: originalMsg.conversation,
      sender: userId,
      receiverId: originalMsg.sender._id,
      message: replyText,
      messageType: 'text',
      replyTo: {
        messageId: originalMsg._id,
        text: originalMsg.message,
        senderName: originalMsg.sender.name,
        senderId: originalMsg.sender._id
      },
      status: 'sent'
    });

    const conversation = await Conversation.findById(originalMsg.conversation);
    conversation.lastMessage = replyText;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Message.findById(reply._id).populate('sender', 'name email');
    const payload = await buildMessagePayload(populated, userId);

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

    if (!conversation.participants.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    conversation.isArchived = !conversation.isArchived;
    await conversation.save();

    res.status(200).json({ success: true, isArchived: conversation.isArchived });
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

    if (!conversation.participants.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    conversation.isPinned = !conversation.isPinned;
    await conversation.save();

    res.status(200).json({ success: true, isPinned: conversation.isPinned });
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

    if (!conversation.participants.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    let mutedUntil = null;
    if (duration !== 'forever') {
      const now = new Date();
      const durations = {
        '1h': 60 * 60 * 1000,
        '8h': 8 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };
      mutedUntil = new Date(now.getTime() + (durations[duration] || 0));
    }

    conversation.isMuted = !conversation.isMuted;
    conversation.mutedUntil = conversation.isMuted ? mutedUntil : null;
    await conversation.save();

    res.status(200).json({
      success: true,
      isMuted: conversation.isMuted,
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
      conversationIds = [conversationId];
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

    if (!conversation.participants.includes(userId)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Message.updateMany(
      { conversation: conversationId },
      { $addToSet: { deletedFor: userId } }
    );

    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
