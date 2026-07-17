import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  applyForJob,
  getStudentApplications
} from '../controllers/jobController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllJobs)
  .post(protect, createJob);

router.get('/applications/me', protect, getStudentApplications);

router.route('/:id')
  .get(protect, getJobById);

router.post('/:id/apply', protect, upload.single('resume'), applyForJob);

export default router;
