import express from 'express';
import {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead
} from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.post('/conversation/:recipientId', protect, startConversation);
router.get('/:conversationId', protect, getMessages);
router.post('/:conversationId', protect, upload.single('attachment'), sendMessage);
router.put('/:conversationId/read', protect, markMessagesAsRead);  // ✅ New route

export default router;
