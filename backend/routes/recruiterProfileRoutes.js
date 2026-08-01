import express from 'express';
import {
  getRecruiterProfile,
  updateRecruiterProfile,
  uploadRecruiterAvatar,
  uploadRecruiterCover,
  removeRecruiterAvatar,
  removeRecruiterCover,
  updateRecruiterPreferences,
  getRecruiterCompletion,
} from '../controllers/recruiterProfileController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/profile/me', protect, recruiterOnly, getRecruiterProfile);
router.put('/profile', protect, recruiterOnly, updateRecruiterProfile);
router.post('/profile/avatar', protect, recruiterOnly, upload.single('avatar'), uploadRecruiterAvatar);
router.post('/profile/cover', protect, recruiterOnly, upload.single('cover'), uploadRecruiterCover);
router.delete('/profile/avatar', protect, recruiterOnly, removeRecruiterAvatar);
router.delete('/profile/cover', protect, recruiterOnly, removeRecruiterCover);
router.put('/profile/preferences', protect, recruiterOnly, updateRecruiterPreferences);
router.get('/profile/completion', protect, recruiterOnly, getRecruiterCompletion);

export default router;
