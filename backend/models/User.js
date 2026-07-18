import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: function() {
        // Password not required for OAuth users
        return !this.googleId && !this.githubId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
    },
    role: {
      type: String,
      enum: ['student', 'recruiter'],
      default: 'student',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    verificationTokenExpire: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    // OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values to not violate unique constraint
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String, // URL to profile picture from OAuth
    },
    // Add these new fields to userSchema
username: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
},
phone: {
  type: String,
  default: '',
},
// Settings preferences
preferences: {
  appearance: {
    theme: { type: String, enum: ['light', 'dark', 'ocean', 'system'], default: 'system' },
    fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' }
  },
  accessibility: {
    reducedMotion: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
    largerText: { type: Boolean, default: false },
    keyboardNavigation: { type: Boolean, default: false }
  },
  privacy: {
    profileVisibility: { type: String, enum: ['public', 'connections', 'recruiters', 'private'], default: 'public' },
    allowConnectionRequests: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    searchEngineIndexing: { type: Boolean, default: true },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true }
  }
},
// Active sessions
activeSessions: [{
  device: String,
  browser: String,
  ip: String,
  location: String,
  loginTime: { type: Date, default: Date.now },
  token: String
}],
loginHistory: [{
  browser: String,
  location: String,
  ip: String,
  loginTime: { type: Date, default: Date.now }
}],
lastLogin: {
  type: Date
},
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },
    hasAcceptedTerms: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12); // Increased to 12 for production
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is complete
userSchema.methods.isProfileComplete = function() {
  return this.name && this.email && this.hasAcceptedTerms;
};

const User = mongoose.model('User', userSchema);
export default User;