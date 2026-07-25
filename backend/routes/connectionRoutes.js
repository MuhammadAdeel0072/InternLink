import express from 'express';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingRequests,
  getConnectionsList,
  getConnectionSuggestions,
  getSentRequests,
  cancelSentRequest,
  getMutualConnections,
  searchNetwork,
  toggleBlockUser,
  toggleFollow
} from '../controllers/connectionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getConnectionsList);
router.get('/pending', protect, getPendingRequests);
router.get('/sent', protect, getSentRequests);
router.get('/suggestions', protect, getConnectionSuggestions);
router.get('/mutual/:userId', protect, getMutualConnections);
router.get('/search', protect, searchNetwork);
router.post('/request/:userId', protect, sendConnectionRequest);
router.put('/accept/:connectionId', protect, acceptConnectionRequest);
router.put('/block/:userId', protect, toggleBlockUser);
router.put('/follow/:userId', protect, toggleFollow);
router.delete('/reject/:connectionId', protect, rejectConnectionRequest);
router.delete('/cancel/:connectionId', protect, cancelSentRequest);

export default router;