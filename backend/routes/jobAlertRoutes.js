import express from 'express';
import { createJobAlert, getJobAlerts, deleteJobAlert } from '../controllers/jobController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getJobAlerts)
  .post(protect, createJobAlert);

router.delete('/:id', protect, deleteJobAlert);

export default router;