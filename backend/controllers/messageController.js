import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Profile from '../models/Profile.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// @desc    Start or retrieve a conversation thread between two users
// @route   POST /api/messages/conversation/:recipientId
// @access  Private
export const startConversation = async (req, res) => {
  try {
    const recipientId = req.params.recipientId;
    const userId = req.user._id;

    if (recipientId === userId.toString()) {
      return res.status(400).json({ message: 'You cannot chat with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        lastMessage: 'Conversation started'
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's conversations list
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name email role')
      .sort({ updatedAt: -1 });

    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== req.user._id.toString()
        );

        if (!otherUser) return null;

        const otherProfile = await Profile.findOne({ user: otherUser._id }).select('avatar');
        return {
          _id: conv._id,
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
          otherUser: {
            _id: otherUser._id,
            name: otherUser.name,
            email: otherUser.email,
            role: otherUser.role,
            avatar: otherProfile?.avatar || ''
          }
        };
      })
    );

    // Remove any nulls due to corrupt/deleted user connections
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
      return res.status(404).json({ message: 'Conversation thread not found' });
    }

    // Check authorization
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(401).json({ message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 }); // Chronological order

    res.status(200).json(messages);
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
    let attachmentUrl = '';
    let attachmentType = 'none';

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation thread not found' });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(401).json({ message: 'Not authorized to post to this conversation' });
    }

    if (req.file) {
      attachmentUrl = await uploadToCloudinary(req.file);
      attachmentType = req.file.mimetype.startsWith('image/') ? 'image' : 'document';
    }

    if (!text && !req.file) {
      return res.status(400).json({ message: 'Message text or attachment is required' });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text || '',
      attachment: attachmentUrl,
      attachmentType: attachmentType
    });

    // Update conversation summary
    conversation.lastMessage = text || (attachmentType === 'image' ? '[Sent an image]' : '[Sent a document]');
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email');
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
