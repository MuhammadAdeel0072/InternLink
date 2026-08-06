import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';

export const protect = async (req, res, next) => {
  console.log(`[PROTECT] ${req.method} ${req.originalUrl} - checking auth`);
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const isBlacklisted = await TokenBlacklist.findOne({ token });
      if (isBlacklisted) {
        console.log(`[PROTECT] ${req.method} ${req.originalUrl} - token blacklisted`);
        return res.status(401).json({ message: 'Not authorized, token has been revoked' });
      }

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        console.log(`[PROTECT] ${req.method} ${req.originalUrl} - user not found`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      if (!req.user.isVerified) {
        console.log(`[PROTECT] ${req.method} ${req.originalUrl} - user not verified`);
        return res.status(403).json({ 
          success: false,
          message: 'Please verify your email before continuing',
          needsVerification: true,
          email: req.user.email
        });
      }

      console.log(`[PROTECT] ${req.method} ${req.originalUrl} - auth passed`);
      next();
    } catch (error) {
      console.error(`[PROTECT] ${req.method} ${req.originalUrl} - JWT error:`, error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.log(`[PROTECT] ${req.method} ${req.originalUrl} - no token provided`);
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};