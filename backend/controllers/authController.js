import User from '../models/User.js';
import Profile from '../models/Profile.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendEmail.js';
import { blacklistToken } from '../middlewares/tokenBlacklist.js';
import { getOAuthOrigin, checkOriginSync } from '../config/cors.js';

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
  const isProduction = process.env.NODE_ENV === 'production';
  // Cross-site cookies require SameSite=None + Secure in production.
  // Development (localhost) uses SameSite=Lax with Secure=false.
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/',
  };
  res.cookie('refreshToken', refreshToken, cookieOptions);
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
  console.log('[registerUser] Register request received', {
    body: { name: req.body.name, email: req.body.email, role: req.body.role, acceptedTerms: req.body.acceptedTerms },
  });
  try {
    console.log('[registerUser] Step 1: Start registration');
    const { name, email, password, role, acceptedTerms } = req.body;

    if (!name || !email || !password) {
      console.log('[registerUser] Validation failed: missing fields');
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    if (acceptedTerms !== true) {
      console.log('[registerUser] Validation failed: terms not accepted');
      return res.status(400).json({
        success: false,
        message: 'You must accept the Terms of Service and Privacy Policy'
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('[registerUser] Validation failed: password does not meet complexity requirements');
      return res.status(400).json({
        success: false,
        message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character'
      });
    }

    console.log('[registerUser] Step 2: Checking if user exists');
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('[registerUser] User already exists');
      return res.status(409).json({ 
        success: false,
        message: 'An account with this email already exists' 
      });
    }

    console.log('[registerUser] Step 3: Creating verification token');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('[registerUser] Verification token generated:', verificationToken);
    const verificationTokenHash = hashToken(verificationToken);
    console.log('[registerUser] Verification token hashed:', verificationTokenHash);
    const verificationTokenExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    console.log('[registerUser] Verification token expires at:', new Date(verificationTokenExpire).toISOString());

    console.log('[registerUser] Step 4: Creating user');
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
    console.log('[registerUser] User created:', user._id);
    console.log('[registerUser] User verificationToken stored:', user.verificationToken);
    console.log('[registerUser] User verificationTokenExpire stored:', user.verificationTokenExpire);

    console.log('[registerUser] Step 5: Creating profile');
    await Profile.create({
      user: user._id,
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    });
    console.log('[registerUser] Profile created');

    console.log('[registerUser] Step 6: Sending verification email');

    // Log SMTP environment variables (mask the password)
    console.log('[registerUser] SMTP env vars:', {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_SECURE: process.env.SMTP_SECURE,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_FROM: process.env.SMTP_FROM,
      SMTP_PASS: process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : '<not set>',
      FRONTEND_URL: process.env.FRONTEND_URL,
      NODE_ENV: process.env.NODE_ENV,
    });

    try {
      console.log('[registerUser] sendVerificationEmail() called with:', {
        email: user.email,
        token: verificationToken,
      });
      await sendVerificationEmail(user.email, verificationToken);
      console.log('[registerUser] Verification email sent');
    } catch (emailError) {
      console.error('[registerUser] Verification email failed:', {
        message: emailError.message,
        code: emailError.code,
        stack: emailError.stack,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode,
      });
    }

    // Do not issue JWT for unverified users - they must verify email first
    console.log('[registerUser] Step 7: Sending response');
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
    console.log('[registerUser] Response sent');
  } catch (error) {
    console.error('[registerUser] Registration error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    console.error('[registerUser] Controller catch block: error details:', error);
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
  console.log('[verifyEmail] Verify email request received, token:', req.params.token);
  try {
    const { token } = req.params;

    if (!token) {
      console.log('[verifyEmail] Token is missing from request params');
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    console.log('[verifyEmail] Hashing token for lookup');
    const tokenHash = hashToken(token);
    console.log('[verifyEmail] Token hash:', tokenHash);

    console.log('[verifyEmail] Searching for user with matching token');
    const user = await User.findOne({
      verificationToken: tokenHash,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      console.log('[verifyEmail] No user found with this token (invalid or expired)');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    console.log('[verifyEmail] User found:', user._id, user.email);
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();
    console.log('[verifyEmail] User verified and token cleared');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    console.error('[verifyEmail] Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
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
  console.log('[resendVerification] request received', { email: req.body.email });
  try {
    const { email } = req.body;

    console.log('[resendVerification] Step 1: Finding user', { email });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[resendVerification] User not found');
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (user.isVerified) {
      console.log('[resendVerification] User already verified');
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    console.log('[resendVerification] Step 2: Generating new verification token');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    console.log('[resendVerification] New token generated:', verificationToken);
    const verificationTokenHash = hashToken(verificationToken);
    user.verificationToken = verificationTokenHash;
    user.verificationTokenExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    console.log('[resendVerification] Token expire:', new Date(user.verificationTokenExpire).toISOString());
    await user.save();
    console.log('[resendVerification] Token saved to database');

    console.log('[resendVerification] Step 3: Calling sendVerificationEmail');
    try {
      await sendVerificationEmail(user.email, verificationToken);
      console.log('[resendVerification] Verification email sent successfully');
    } catch (emailError) {
      console.error('[resendVerification] Verification email failed:', {
        message: emailError.message,
        code: emailError.code,
        stack: emailError.stack,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode,
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('[resendVerification] Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
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

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Password reset email error:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode,
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
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
    console.log('[loginUser] Step 1: Start login');
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    console.log('[loginUser] Step 2: Finding user by email');
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('[loginUser] User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    console.log('[loginUser] User found:', user._id);

    if (user.authProvider !== 'local') {
      console.log('[loginUser] Auth provider mismatch:', user.authProvider);
      return res.status(400).json({
        success: false,
        message: `This account uses ${user.authProvider} authentication. Please sign in with ${user.authProvider}.`
      });
    }

    console.log('[loginUser] Step 3: Comparing password');
    if (!(await user.comparePassword(password))) {
      console.log('[loginUser] Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    console.log('[loginUser] Password matched');

    if (!user.isVerified) {
      console.log('[loginUser] User not verified');
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        needsVerification: true,
        email: user.email
      });
    }

    console.log('[loginUser] Step 4: Generating tokens');
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

    console.log('[loginUser] Step 5: Updating lastLogin');
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    console.log('[loginUser] lastLogin updated');

    console.log('[loginUser] Step 6: Sending response');
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
    console.log('[loginUser] Response sent');
  } catch (error) {
    console.error('[loginUser] Login error:', error);
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

    // Determine the correct frontend origin for redirect.
    // Priority: state nonce → Origin header → Referer header → FRONTEND_URL env → localhost fallback
    let frontendURL =
      getOAuthOrigin(req.query.state) ||
      req.get('origin') ||
      req.get('referer')?.replace(/\/$/, '') ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173';

    // Ensure the resolved origin is in our allow-list
    if (!checkOriginSync(frontendURL)) {
      frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    }

    // Strip any trailing path from referer (it may be a full page URL)
    if (frontendURL.includes('/') && !frontendURL.startsWith('http')) {
      frontendURL = `http://${frontendURL}`;
    }

    res.redirect(`${frontendURL}/oauth/callback?token=${token}&userId=${user._id}`);
  } catch (error) {
    console.error('OAuth success error:', error);
    const fallbackURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${fallbackURL}/login?error=oauth_failed`);
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
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
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
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
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
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
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
