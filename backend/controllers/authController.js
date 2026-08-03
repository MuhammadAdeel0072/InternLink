import User from '../models/User.js';
import Profile from '../models/Profile.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
import { blacklistToken } from '../middlewares/tokenBlacklist.js';

/**
 * Generate a JWT access token for a user
 * @param {string} id - The user's MongoDB _id
 * @returns {string} Signed JWT token with 1-day expiration
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

/**
 * Generate a JWT refresh token for a user
 * @param {string} id - The user's MongoDB _id
 * @returns {string} Signed JWT refresh token with 7-day expiration
 */
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Set the refresh token as an HTTP-only secure cookie
 * @param {object} res - Express response object
 * @param {string} refreshToken - The refresh token to set
 * @param {number} days - Cookie max age in days (default: 7)
 */
export const setRefreshTokenCookie = (res, refreshToken, days = 7) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: days * 24 * 60 * 60 * 1000,
  });
};

/**
 * Hash a token using SHA-256 for secure database storage
 * @param {string} token - The plain token to hash
 * @returns {string} SHA-256 hex digest of the token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, acceptedTerms } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    if (acceptedTerms !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the Terms of Service and Privacy Policy'
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ 
        success: false,
        message: 'An account with this email already exists' 
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = hashToken(verificationToken);
    const verificationTokenExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      verificationToken: verificationTokenHash,
      verificationTokenExpire,
      isVerified: false,
      hasAcceptedTerms: true,
      authProvider: 'local',
    });

    await Profile.create({
      user: user._id,
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    });

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error('Verification email failed:', emailError);
    }

    // Do not issue JWT for unverified users - they must verify email first
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: null,
        requiresVerification: true
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration' 
    });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      verificationToken: tokenHash,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = hashToken(verificationToken);
    user.verificationToken = verificationTokenHash;
    user.verificationTokenExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email'
    });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before resetting password',
        needsVerification: true,
        email: user.email
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email'
    });
  }
};

// @desc    Validate reset token
// @route   GET /api/auth/validate-reset-token/:token
// @access  Public
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid'
    });
  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating reset token'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character'
      });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.authProvider !== 'local') {
      return res.status(400).json({
        success: false,
        message: `This account uses ${user.authProvider} authentication. Please sign in with ${user.authProvider}.`
      });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        needsVerification: true,
        email: user.email
      });
    }

    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: rememberMe ? '30d' : '1d' }
    );
    
    const refreshToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: rememberMe ? '30d' : '7d' }
    );
    
    setRefreshTokenCookie(res, refreshToken, rememberMe ? 30 : 7);

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

  res.status(200).json({
  success: true,
  message: 'Login successful',
  token,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  username: user.username,
  phone: user.phone,
  googleId: user.googleId,
  githubId: user.githubId,
  preferences: user.preferences
  });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    OAuth callback success handler
// @route   GET /api/auth/oauth/success
// @access  Private (after OAuth)
export const oAuthSuccess = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshTokenCookie(res, refreshToken);

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendURL}/oauth/callback?token=${token}&userId=${user._id}`);
  } catch (error) {
    console.error('OAuth success error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.status(200).json({
        success: true,
        data: user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
};

// @desc    Update account settings
// @route   PUT /api/auth/account
// @access  Private
export const updateAccount = async (req, res) => {
  try {
    const { name, username, email, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
      user.username = username;
    }
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
      user.isVerified = false;
    }
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.authProvider !== 'local') {
      return res.status(400).json({ success: false, message: 'OAuth users cannot change password' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character' 
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update preferences
// @route   PUT /api/auth/preferences
// @access  Private
export const updatePreferences = async (req, res) => {
  try {
    const { type, data } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.preferences) {
      user.preferences = {};
    }

    user.preferences[type] = { ...user.preferences[type], ...data };
    await user.save();

    res.status(200).json({
      success: true,
      message: `${type} settings updated`,
      data: user.preferences
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get login history & active sessions
// @route   GET /api/auth/sessions
// @access  Private
export const getSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('activeSessions loginHistory');

    res.status(200).json({
      success: true,
      data: {
        activeSessions: user.activeSessions || [],
        loginHistory: user.loginHistory || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout current session
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await blacklistToken(token, req.user._id, 'logout');
    }
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.activeSessions = [];
    await user.save();

    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await blacklistToken(token, req.user._id, 'logout');
    }
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    await Profile.findOneAndDelete({ user: req.user._id });
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Disconnect OAuth provider
// @route   PUT /api/auth/disconnect-provider
// @access  Private
export const disconnectProvider = async (req, res) => {
  try {
    const { provider } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (provider === 'google') user.googleId = undefined;
    if (provider === 'github') user.githubId = undefined;
    
    await user.save();
    res.status(200).json({ success: true, message: `${provider} disconnected` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
