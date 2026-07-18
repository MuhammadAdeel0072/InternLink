import express from 'express';
import passport from 'passport';
import {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  oAuthSuccess,
  getMe,
  updateAccount,
  changePassword,
  updatePreferences,
  getSessions,
  logoutAllDevices,
  deleteAccount,
  disconnectProvider
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Local authentication
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}));

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login?error=google_auth_failed',
    session: false,
  }),
  oAuthSuccess
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', {
  scope: ['user:email'],
  session: false,
}));

router.get('/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/login?error=github_auth_failed',
    session: false,
  }),
  oAuthSuccess
);

// Get current user
router.get('/me', protect, getMe);
// Settings routes
router.put('/account', protect, updateAccount);
router.put('/change-password', protect, changePassword);
router.put('/preferences', protect, updatePreferences);
router.put('/disconnect-provider', protect, disconnectProvider);
router.get('/sessions', protect, getSessions);
router.post('/logout-all', protect, logoutAllDevices);
router.delete('/account', protect, deleteAccount);

export default router;