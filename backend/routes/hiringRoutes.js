import express from 'express';
import {
  getHirings,
  getHiringDetails,
  createHiring,
  updateHiring,
  generateEmployeeIdAction,
  uploadDocument,
  verifyDocument,
  updateChecklist,
  sendWelcomeEmailAction,
  assignManager,
  assignOfficeAndEquipment,
  updateStatus,
  getHiringStats,
  getHiringTimeline,
  getChecklistProgress,
  getStudentOnboarding,
  getStudentOnboardingById,
  requestDocumentReupload,
  getOnboardingReminders,
  markReminderSent,
  getHiringByOfferId,
  deleteHiring
} from '../controllers/hiringController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';

const router = express.Router();

router.get('/', protect, getHirings);
router.get('/stats', protect, recruiterOnly, getHiringStats);
router.get('/by-offer/:offerId', protect, getHiringByOfferId);
router.get('/:id', protect, getHiringDetails);
router.get('/:id/timeline', protect, getHiringTimeline);
router.get('/:id/checklist', protect, getChecklistProgress);
router.post('/', protect, recruiterOnly, createHiring);
router.put('/:id', protect, recruiterOnly, updateHiring);
router.post('/:id/generate-employee-id', protect, recruiterOnly, generateEmployeeIdAction);
router.post('/:id/documents', protect, uploadDocument);
router.put('/:id/documents/:docIndex/verify', protect, recruiterOnly, verifyDocument);
router.put('/:id/checklist', protect, recruiterOnly, updateChecklist);
router.post('/:id/send-welcome-email', protect, recruiterOnly, sendWelcomeEmailAction);
router.put('/:id/manager', protect, recruiterOnly, assignManager);
router.put('/:id/assignment', protect, recruiterOnly, assignOfficeAndEquipment);
router.put('/:id/status', protect, recruiterOnly, updateStatus);
router.post('/:id/reminder-sent', protect, recruiterOnly, markReminderSent);
router.delete('/:id', protect, recruiterOnly, deleteHiring);

router.get('/student/onboarding', protect, getStudentOnboarding);
router.get('/student/onboarding/:id', protect, getStudentOnboardingById);
router.post('/student/onboarding/:id/documents/request', protect, requestDocumentReupload);
router.get('/student/onboarding/reminders', protect, getOnboardingReminders);

export default router;