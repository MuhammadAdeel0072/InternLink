import dotenv from 'dotenv';
dotenv.config();
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

// Serialize user for session (if using sessions)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy - Only initialize if credentials exist
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({
            $or: [
              { googleId: profile.id },
              { email: profile.emails[0].value }
            ]
          });

          if (user) {
            // If user exists but doesn't have googleId, link accounts
            if (!user.googleId) {
              user.googleId = profile.id;
              user.isVerified = true;
              if (!user.avatar) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
            }
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            avatar: profile.photos[0].value,
            isVerified: true, // Google accounts are pre-verified
            authProvider: 'google',
            hasAcceptedTerms: false, // Will need to accept on first login
          });

          // Create profile for new user
          await Profile.create({
            user: user._id,
            skills: [],
            education: [],
            experience: [],
            projects: [],
            certifications: [],
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
} else {
  console.warn('⚠️  Google OAuth credentials not configured. Google login will be disabled.');
}

// GitHub Strategy - Only initialize if credentials exist
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '/api/auth/github/callback',
        scope: ['user:email'],
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Get primary email from GitHub
          const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;

          let user = await User.findOne({
            $or: [
              { githubId: profile.id },
              { email: email }
            ]
          });

          if (user) {
            if (!user.githubId) {
              user.githubId = profile.id;
              user.isVerified = true;
              if (!user.avatar) {
                user.avatar = profile.photos[0].value;
              }
              await user.save();
            }
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName || profile.username,
            email: email,
            githubId: profile.id,
            avatar: profile.photos[0].value,
            isVerified: true,
            authProvider: 'github',
            hasAcceptedTerms: false,
          });

          await Profile.create({
            user: user._id,
            skills: [],
            education: [],
            experience: [],
            projects: [],
            certifications: [],
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
} else {
  console.warn('⚠️  GitHub OAuth credentials not configured. GitHub login will be disabled.');
}

export default passport;