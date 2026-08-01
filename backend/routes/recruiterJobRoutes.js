import express from 'express';
import {
  getRecruiterJobs,
  getRecruiterJobById,
  createRecruiterJob,
  updateRecruiterJob,
  deleteRecruiterJob,
  closeRecruiterJob,
  reopenRecruiterJob,
  duplicateRecruiterJob,
  publishRecruiterJob,
  getJobAnalytics,
  incrementJobViews,
} from '../controllers/recruiterJobController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/jobs', protect, recruiterOnly, getRecruiterJobs);
router.get('/jobs/:id', protect, recruiterOnly, getRecruiterJobById);
router.post('/jobs', protect, recruiterOnly, createRecruiterJob);
router.put('/jobs/:id', protect, recruiterOnly, updateRecruiterJob);
router.delete('/jobs/:id', protect, recruiterOnly, deleteRecruiterJob);
router.post('/jobs/:id/close', protect, recruiterOnly, closeRecruiterJob);
router.post('/jobs/:id/reopen', protect, recruiterOnly, reopenRecruiterJob);
router.post('/jobs/:id/duplicate', protect, recruiterOnly, duplicateRecruiterJob);
router.post('/jobs/:id/publish', protect, recruiterOnly, publishRecruiterJob);
router.get('/jobs/:id/analytics', protect, recruiterOnly, getJobAnalytics);
router.post('/jobs/:id/view', incrementJobViews);

export default router;