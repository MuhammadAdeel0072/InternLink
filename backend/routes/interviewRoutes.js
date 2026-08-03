import express from 'express';
import {
  getInterviews,
  getInterviewDetails,
  createInterview,
  updateInterview,
  rescheduleInterview,
  cancelInterview,
  confirmInterview,
  requestReschedule,
  completeInterview,
  addFeedback,
  addNote,
  getInterviewAnalytics,
  exportInterviews,
  getUpcomingInterviews,
  sendInterviewReminders,
  declineInterview,
  markNoShow,
  approveRescheduleRequest,
  rejectRescheduleRequest
} from '../controllers/interviewController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';

const router = express.Router();

router.get('/', protect, getInterviews);
router.get('/analytics', protect, getInterviewAnalytics);
router.get('/upcoming', protect, getUpcomingInterviews);
router.get('/export', protect, recruiterOnly, exportInterviews);
router.get('/:id', protect, getInterviewDetails);
router.post('/', protect, recruiterOnly, createInterview);
router.put('/:id', protect, recruiterOnly, updateInterview);
router.post('/:id/reschedule', protect, rescheduleInterview);
router.post('/:id/cancel', protect, cancelInterview);
router.post('/:id/confirm', protect, confirmInterview);
router.post('/:id/decline', protect, declineInterview);
router.post('/:id/request-reschedule', protect, requestReschedule);
router.post('/:id/complete', protect, recruiterOnly, completeInterview);
router.post('/:id/feedback', protect, recruiterOnly, addFeedback);
router.post('/:id/notes', protect, recruiterOnly, addNote);
router.post('/:id/no-show', protect, recruiterOnly, markNoShow);
router.post('/:id/approve-reschedule', protect, recruiterOnly, approveRescheduleRequest);
router.post('/:id/reject-reschedule', protect, recruiterOnly, rejectRescheduleRequest);
router.post('/reminders', protect, recruiterOnly, sendInterviewReminders);

export default router;
