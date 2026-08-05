import express from 'express';
import {
  getTalentPool,
  getTalentPoolEntry,
  addToTalentPool,
  updateTalentPoolEntry,
  removeFromTalentPool,
  toggleFavorite,
  toggleArchive,
  rateCandidate,
  addNote,
  deleteNote,
  addTag,
  inviteCandidate,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  exportTalentPool,
  getTalentPoolStats
} from '../controllers/talentPoolController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';

const router = express.Router();

router.get('/stats', protect, recruiterOnly, getTalentPoolStats);
router.get('/', protect, recruiterOnly, getTalentPool);
router.get('/:id', protect, recruiterOnly, getTalentPoolEntry);
router.post('/', protect, recruiterOnly, addToTalentPool);
router.put('/:id', protect, recruiterOnly, updateTalentPoolEntry);
router.delete('/:id', protect, recruiterOnly, removeFromTalentPool);
router.put('/:id/favorite', protect, recruiterOnly, toggleFavorite);
router.put('/:id/archive', protect, recruiterOnly, toggleArchive);
router.put('/:id/rate', protect, recruiterOnly, rateCandidate);
router.put('/:id/note', protect, recruiterOnly, addNote);
router.delete('/:id/note/:noteIndex', protect, recruiterOnly, deleteNote);
router.put('/:id/tag', protect, recruiterOnly, addTag);
router.post('/invite', protect, recruiterOnly, inviteCandidate);
router.get('/collections', protect, recruiterOnly, getCollections);
router.post('/collections', protect, recruiterOnly, createCollection);
router.put('/collections/:id', protect, recruiterOnly, updateCollection);
router.delete('/collections/:id', protect, recruiterOnly, deleteCollection);
router.post('/export', protect, recruiterOnly, exportTalentPool);

export default router;
