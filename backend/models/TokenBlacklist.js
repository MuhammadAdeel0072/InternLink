import mongoose from 'mongoose';

const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  reason: {
    type: String,
    enum: ['logout', 'password_change', 'account_deletion'],
    default: 'logout'
  }
}, { timestamps: true });

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
export default TokenBlacklist;
