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
  logout,
  logoutAllDevices,
  deleteAccount,
  disconnectProvider,
  forgotPassword,
  validateResetToken,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { passwordResetLimiter, loginLimiter } from '../middlewares/rateLimiter.js';
import { validateRegister, validateLogin, validatePasswordReset } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Local authentication
router.post('/register', validateRegister, registerUser);
router.post('/login', loginLimiter, validateLogin, loginUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset routes with stricter rate limiting
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.get('/validate-reset-token/:token', passwordResetLimiter, validateResetToken);
router.post('/reset-password/:token', passwordResetLimiter, validatePasswordReset, resetPassword);

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
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAllDevices);
router.delete('/account', protect, deleteAccount);

export default router;