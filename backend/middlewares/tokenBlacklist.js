import jwt from 'jsonwebtoken';
import TokenBlacklist from '../models/TokenBlacklist.js';

export const blacklistToken = async (token, userId, reason = 'logout') => {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) return;
  
  const expiresAt = new Date(decoded.exp * 1000);
  await TokenBlacklist.create({
    token,
    userId,
    expiresAt,
    reason
  });
};