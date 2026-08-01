import express from 'express';
import {
  getApplicants,
  getApplicantDetails,
  updateApplicantStatus,
  addNote,
  scheduleInterview,
  messageApplicant,
  getApplicantAnalytics,
  bulkApplicantActions,
  exportApplicants
} from '../controllers/applicantController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';

const router = express.Router();

router.get('/', protect, recruiterOnly, getApplicants);
router.get('/analytics', protect, recruiterOnly, getApplicantAnalytics);
router.get('/export', protect, recruiterOnly, exportApplicants);
router.get('/:id', protect, recruiterOnly, getApplicantDetails);
router.put('/:id/status', protect, recruiterOnly, updateApplicantStatus);
router.post('/:id/notes', protect, recruiterOnly, addNote);
router.post('/:id/interview', protect, recruiterOnly, scheduleInterview);
router.post('/:id/message', protect, recruiterOnly, messageApplicant);
router.post('/bulk', protect, recruiterOnly, bulkApplicantActions);

export default router;
