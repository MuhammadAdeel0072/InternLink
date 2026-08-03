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
import { validateJob, validateObjectId } from '../middlewares/validationMiddleware.js';

const router = express.Router();

router.route('/')
  .get( getAllJobs)
  .post(protect, validateJob, createJob);

router.get('/saved', protect, getSavedJobs);
router.get('/recommended', protect, getRecommendedJobs);
router.get('/applications/me', protect, getStudentApplications);

router.route('/:id')
  .get(protect, validateObjectId, getJobById);

router.post('/:id/save', protect, validateObjectId, toggleSaveJob);
router.post('/:id/apply', protect, validateObjectId, upload.single('resume'), applyForJob);
router.get('/:id/similar', protect, validateObjectId, getSimilarJobs);

router.delete('/applications/:id', protect, validateObjectId, withdrawApplication);

export default router;