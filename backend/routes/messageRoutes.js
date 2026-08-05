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

router.get('/', protect, searchMessages);
router.get('/conversations', protect, getConversations);
router.post('/conversation/:recipientId', protect, startConversation);
router.get('/:conversationId', protect, getMessages);
router.post('/:conversationId', protect, upload.single('attachment'), sendMessage);
router.put('/:conversationId/read', protect, markMessagesAsRead);
router.put('/:id', protect, editMessage);
router.delete('/:id', protect, deleteMessage);
router.put('/:id/react', protect, reactToMessage);
router.put('/:id/reply', protect, replyToMessage);
router.put('/archive/:conversationId', protect, archiveConversation);
router.put('/pin/:conversationId', protect, pinConversation);
router.put('/mute/:conversationId', protect, muteConversation);
router.post('/upload', protect, upload.single('attachment'), uploadFile);
router.delete('/:conversationId/chat', protect, deleteConversation);

export default router;
