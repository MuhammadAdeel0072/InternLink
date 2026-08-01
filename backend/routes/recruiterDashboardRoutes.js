import express from 'express';
import { getRecruiterDashboardStats } from '../controllers/recruiterDashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';

const router = express.Router();

router.get('/stats', protect, recruiterOnly, getRecruiterDashboardStats);

export default router;
