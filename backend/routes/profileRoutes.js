import express from 'express';
import {
  getCurrentProfile,
  getProfileByUserId,
  updateProfile,
  uploadAvatar,
  uploadCover,
  uploadResume,
  addEducation,
  updateEducation,
  deleteEducation,
  addExperience,
  updateExperience,
  deleteExperience,
  addProject,
  updateProject,
  deleteProject,
  addCertification,
  updateCertification,
  deleteCertification,
  updateSkills,
  // ✅ New imports
  addPortfolioLink,
  updatePortfolioLink,
  deletePortfolioLink,
} from '../controllers/profileController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// General profiles
router.get('/me', protect, getCurrentProfile);
router.get('/user/:userId', getProfileByUserId);
router.put('/', protect, updateProfile);

// Image/file uploads
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/cover', protect, upload.single('cover'), uploadCover);
router.post('/resume', protect, upload.single('resume'), uploadResume);

// ✅ Portfolio Links
router.post('/portfolio-links', protect, addPortfolioLink);
router.put('/portfolio-links/:linkId', protect, updatePortfolioLink);
router.delete('/portfolio-links/:linkId', protect, deletePortfolioLink);

// Education
router.post('/education', protect, addEducation);
router.put('/education/:eduId', protect, updateEducation);
router.delete('/education/:eduId', protect, deleteEducation);

// Experience
router.post('/experience', protect, addExperience);
router.put('/experience/:expId', protect, updateExperience);
router.delete('/experience/:expId', protect, deleteExperience);

// Projects
router.post('/projects', protect, upload.single('projectImage'), addProject);
router.put('/projects/:projId', protect, upload.single('projectImage'), updateProject);
router.delete('/projects/:projId', protect, deleteProject);

// Certifications
router.post('/certifications', protect, addCertification);
router.put('/certifications/:certId', protect, updateCertification);
router.delete('/certifications/:certId', protect, deleteCertification);

// Skills
router.put('/skills', protect, updateSkills);

export default router;