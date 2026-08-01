import express from 'express';
import {
  searchCompanies,
  getCompanyById,
  createCompany,
  joinCompany,
  cancelJoinRequest,
  uploadCompanyLogo,
  uploadCompanyCover,
  removeCompanyLogo,
  removeCompanyCover,
} from '../controllers/companyController.js';
import { protect } from '../middlewares/authMiddleware.js';
import recruiterOnly from '../middlewares/recruiterOnly.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/search', searchCompanies);
router.get('/:id', getCompanyById);
router.post('/', protect, recruiterOnly, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), createCompany);
router.post('/:id/join', protect, recruiterOnly, joinCompany);
router.delete('/:id/join', protect, recruiterOnly, cancelJoinRequest);
router.post('/:id/logo', protect, recruiterOnly, upload.single('logo'), uploadCompanyLogo);
router.post('/:id/cover', protect, recruiterOnly, upload.single('coverImage'), uploadCompanyCover);
router.delete('/:id/logo', protect, recruiterOnly, removeCompanyLogo);
router.delete('/:id/cover', protect, recruiterOnly, removeCompanyCover);

export default router;
