import express from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  applyForJob,
  getStudentApplications,
  toggleSaveJob,
  getSavedJobs,
  getRecommendedJobs,
  getSimilarJobs,
  withdrawApplication,
} from '../controllers/jobController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get( getAllJobs)
  .post(protect,createJob);

router.get('/saved', protect, getSavedJobs);
router.get('/recommended', protect, getRecommendedJobs);
router.get('/applications/me', protect, getStudentApplications);

router.route('/:id')
  .get(protect, getJobById);

router.post('/:id/save', protect, toggleSaveJob);
router.post('/:id/apply', protect, upload.single('resume'), applyForJob);
router.get('/:id/similar', protect, getSimilarJobs);

router.delete('/applications/:id', protect, withdrawApplication);

export default router;