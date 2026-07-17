import User from '../models/User.js';
import Profile from '../models/Profile.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/sendEmail.js'; // You'll need to create this

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', {
    expiresIn: '1d',
  });
};

// Helper: Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'refreshsecretkey', {
    expiresIn: '7d',
  });
};

// Helper: Set refresh token cookie
const setRefreshTokenCookie = (res, refreshToken, days = 7) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: days * 24 * 60 * 60 * 1000,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, acceptedTerms } = req.body;

    // Validation
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

    // Password strength validation (server-side)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character'
      });
    }

    // Check for duplicate
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ 
        success: false,
        message: 'An account with this email already exists' 
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      verificationToken,
      verificationTokenExpire,
      isVerified: false,
      hasAcceptedTerms: true,
      authProvider: 'local',
    });

    // Create profile
    await Profile.create({
      user: user._id,
      skills: [],
      education: [],
      experience: [],
      projects: [],
      certifications: [],
    });

    // Send verification email (in production)
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error('Verification email failed:', emailError);
      // Continue registration even if email fails
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token,
        verificationToken, // Include for development convenience
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
// @route   GET /api/auth/verify/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
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

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
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

    // Check if user is using OAuth
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
        email: user.email,
        verificationToken: user.verificationToken
      });
    }

    // Generate tokens with remember me option
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'secretkey', 
      { expiresIn: rememberMe ? '30d' : '1d' }
    );
    
    const refreshToken = jwt.sign(
      { id: user._id }, 
      process.env.JWT_REFRESH_SECRET || 'refreshsecretkey', 
      { expiresIn: rememberMe ? '30d' : '7d' }
    );
    
    setRefreshTokenCookie(res, refreshToken, rememberMe ? 30 : 7);

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Return flat structure for frontend compatibility
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified
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

    // Redirect to frontend with token
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