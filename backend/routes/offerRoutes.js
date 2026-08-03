import express from 'express';
import {
  getOffers,
  getOfferDetails,
  createOffer,
  updateOffer,
  sendOffer,
  viewOffer,
  acceptOffer,
  rejectOffer,
  negotiateOffer,
  withdrawOffer,
  duplicateOffer,
  deleteOffer,
  getOfferAnalytics,
  exportOffers,
  getOfferTemplates,
  sendOfferReminder,
  getStudentOffers
} from '../controllers/offerController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';

const router = express.Router();

router.get('/', protect, getOffers);
router.get('/analytics', protect, recruiterOnly, getOfferAnalytics);
router.get('/export', protect, recruiterOnly, exportOffers);
router.get('/templates', protect, getOfferTemplates);
router.get('/student/offers', protect, getStudentOffers);
router.get('/:id', protect, getOfferDetails);
router.post('/', protect, recruiterOnly, createOffer);
router.put('/:id', protect, recruiterOnly, updateOffer);
router.post('/:id/send', protect, recruiterOnly, sendOffer);
router.post('/:id/view', protect, viewOffer);
router.post('/:id/accept', protect, acceptOffer);
router.post('/:id/reject', protect, rejectOffer);
router.post('/:id/negotiate', protect, negotiateOffer);
router.post('/:id/withdraw', protect, recruiterOnly, withdrawOffer);
router.post('/:id/duplicate', protect, recruiterOnly, duplicateOffer);
router.delete('/:id', protect, recruiterOnly, deleteOffer);
router.post('/:id/remind', protect, recruiterOnly, sendOfferReminder);

export default router;
