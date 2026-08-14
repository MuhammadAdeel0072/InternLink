import express from 'express';
import {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessage,
  reactToMessage,
  replyToMessage,
  archiveConversation,
  pinConversation,
  muteConversation,
  uploadFile,
  searchMessages,
  deleteConversation
} from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// ── Static / prefixed routes FIRST to prevent wildcard /:id from shadowing ──

// GET /api/messages?q=...  (search)
router.get('/', protect, searchMessages);

// GET /api/messages/conversations
router.get('/conversations', protect, getConversations);

// POST /api/messages/conversation/:recipientId  (start / get conversation)
router.post('/conversation/:recipientId', protect, startConversation);

// POST /api/messages/upload  (file upload)
router.post('/upload', protect, upload.single('attachment'), uploadFile);

// PUT /api/messages/archive/:conversationId
// MUST be before PUT /:id — otherwise Express matches "archive" as the :id
router.put('/archive/:conversationId', protect, archiveConversation);

// PUT /api/messages/pin/:conversationId
router.put('/pin/:conversationId', protect, pinConversation);

// PUT /api/messages/mute/:conversationId
router.put('/mute/:conversationId', protect, muteConversation);

// ── Conversation-scoped routes ──

// GET /api/messages/:conversationId  (load messages)
router.get('/:conversationId', protect, getMessages);

// POST /api/messages/:conversationId  (send message)
router.post('/:conversationId', protect, upload.single('attachment'), sendMessage);

// PUT /api/messages/:conversationId/read
// MUST be before PUT /:id — "read" sub-path would otherwise match /:id
router.put('/:conversationId/read', protect, markMessagesAsRead);

// DELETE /api/messages/:conversationId/chat  (delete entire conversation)
// MUST be before DELETE /:id
router.delete('/:conversationId/chat', protect, deleteConversation);

// ── Message-level routes (wildcard /:id — must be last) ──

// PUT /api/messages/:id/react
router.put('/:id/react', protect, reactToMessage);

// PUT /api/messages/:id/reply
router.put('/:id/reply', protect, replyToMessage);

// PUT /api/messages/:id  (edit message — generic wildcard, must be last PUT)
router.put('/:id', protect, editMessage);

// DELETE /api/messages/:id  (delete single message — generic wildcard, must be last DELETE)
router.delete('/:id', protect, deleteMessage);

export default router;
