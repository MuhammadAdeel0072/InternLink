import express from 'express';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingRequests,
  getConnectionsList,
  getConnectionSuggestions
} from '../controllers/connectionController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getConnectionsList);
router.get('/pending', protect, getPendingRequests);
router.get('/suggestions', protect, getConnectionSuggestions);
router.post('/request/:userId', protect, sendConnectionRequest);
router.put('/accept/:connectionId', protect, acceptConnectionRequest);
router.delete('/reject/:connectionId', protect, rejectConnectionRequest);

export default router;
