
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import passport from 'passport';
import connectDB from './config/db.js';
import './config/passport.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import TokenBlacklist from './models/TokenBlacklist.js';
import { authLimiter, generalLimiter, passwordResetLimiter } from './middlewares/rateLimiter.js';
import {
  ALLOWED_ORIGINS,
  isAllowedOrigin,
  storeOAuthOrigin,
  getOAuthOrigin,
  APP_VERSION,
} from './config/cors.js';

import jobAlertRoutes from './routes/jobAlertRoutes.js';
import recruiterProfileRoutes from './routes/recruiterProfileRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import recruiterDashboardRoutes from './routes/recruiterDashboardRoutes.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import postRoutes from './routes/postRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import searchRoutes from './routes/searchRoutes.js';
import recruiterJobRoutes from './routes/recruiterJobRoutes.js';
import applicantRoutes from './routes/applicantRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import hiringRoutes from './routes/hiringRoutes.js';
import talentPoolRoutes from './routes/talentPoolRoutes.js';
import aiRoutes from "./routes/aiRoutes.js";

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Debug test route - placed BEFORE all middleware to verify basic Express response
app.get('/debug-test', (req, res) => {
  console.log('[DEBUG-TEST] Hit /debug-test');
  res.status(200).json({ success: true, message: 'Debug test works', timestamp: new Date().toISOString() });
});

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: isAllowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }
});

// Map to track active user socket connections
const userSocketMap = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('register', (userId) => {
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`Registered user ${userId} to socket ${socket.id}`);
    }
  });

  socket.on('send_message_alert', ({ recipientId, message }) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', message);
      io.to(recipientSocketId).emit('message:new', {
        conversationId: message.conversation || message._id,
        message,
        senderId: message.sender?._id || message.sender
      });
    }
  });

  socket.on('send_notification_alert', ({ recipientId, notification }) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_notification', notification);
    }
  });

  socket.on('notification:read', ({ notificationId, userId }) => {
    const recipientSocketId = userSocketMap.get(userId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('notification:updated', { notificationId, isRead: true });
    }
  });

  socket.on('notification:delete', ({ notificationId, userId }) => {
    const recipientSocketId = userSocketMap.get(userId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('notification:updated', { notificationId, isDeleted: true });
    }
  });

  socket.on('message:typing', ({ conversationId, userId, recipientId }) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message:typing', { conversationId, userId });
    }
  });

  socket.on('message:stopTyping', ({ conversationId, userId, recipientId }) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message:stopTyping', { conversationId, userId });
    }
  });

  socket.on('message:seen', async ({ conversationId, userId, messageIds }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds }, sender: { $ne: userId } },
        { status: 'read' }
      );
      const recipientSocketId = userSocketMap.get(userId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message:seen', { conversationId, messageIds });
      }
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  });

  socket.on('message:reaction', async ({ messageId, userId, emoji, recipientId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      const existingReaction = msg.reactions.find(
        (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
      );

      if (existingReaction) {
        msg.reactions = msg.reactions.filter(
          (r) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
        );
      } else {
        msg.reactions = msg.reactions.filter(
          (r) => !(r.userId.toString() === userId.toString())
        );
        msg.reactions.push({ userId, emoji });
      }

      await msg.save();

      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message:reaction', {
          messageId,
          reactions: msg.reactions
        });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  });

  socket.on('message:edit', async ({ messageId, userId, newMessage, recipientId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg || msg.sender.toString() !== userId.toString()) return;

      msg.message = newMessage;
      msg.edited = true;
      msg.editedAt = new Date();
      await msg.save();

      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message:edit', {
          messageId,
          message: newMessage,
          edited: true,
          editedAt: msg.editedAt
        });
      }
    } catch (error) {
      console.error('Error handling message edit:', error);
    }
  });

  socket.on('message:delete', async ({ messageId, userId, recipientId, deleteForEveryone }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (deleteForEveryone && msg.sender.toString() === userId.toString()) {
        msg.deleted = true;
        msg.message = 'This message was deleted';
        msg.attachments = [];
        await msg.save();
      } else {
        if (!msg.deletedFor.includes(userId)) {
          msg.deletedFor.push(userId);
          await msg.save();
        }
      }

      const recipientSocketId = userSocketMap.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('message:delete', {
          messageId,
          deleted: msg.deleted
        });
      }
    } catch (error) {
      console.error('Error handling message delete:', error);
    }
  });

  socket.on('conversation:update', async ({ conversationId, userId }) => {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const recipientId = conversation.participants.find(
        (p) => p.toString() !== userId.toString()
      );

      if (recipientId) {
        const recipientSocketId = userSocketMap.get(recipientId.toString());
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('conversation:update', {
            conversationId,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt
          });
        }
      }
    } catch (error) {
      console.error('Error handling conversation update:', error);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        console.log(`Unregistered user ${userId}`);
        break;
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Pass IO instance to request context
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = userSocketMap;
  next();
});

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https://internlink.adeelkhan.online", "https://intern-link-brrv.vercel.app"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Trust proxy for correct X-Frame-Options behind reverse proxy
app.set('trust proxy', 1);

app.use(mongoSanitize());
app.use(xss());
app.use(compression());
app.use(cookieParser());

app.use(cors({
  origin: isAllowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours preflight cache
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Initialize Passport
app.use(passport.initialize());

// Mount API routes with rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', generalLimiter, profileRoutes);
app.use('/api/connections', generalLimiter, connectionRoutes);
app.use('/api/posts', generalLimiter, postRoutes);
app.use('/api/jobs', generalLimiter, jobRoutes);
app.use('/api/recruiter/jobs', generalLimiter, recruiterJobRoutes);
app.use('/api/job-alerts', generalLimiter, jobAlertRoutes);
app.use('/api/search', generalLimiter, searchRoutes);
app.use('/api/messages', generalLimiter, messageRoutes);
app.use('/api/notifications', generalLimiter, notificationRoutes);
app.use('/api/recruiter', generalLimiter, recruiterProfileRoutes);
app.use('/api/companies', generalLimiter, companyRoutes);
app.use('/api/recruiter/dashboard', generalLimiter, recruiterDashboardRoutes);
app.use('/api/applicants', generalLimiter, applicantRoutes);
app.use('/api/interviews', generalLimiter, interviewRoutes);
app.use('/api/offers', generalLimiter, offerRoutes);
app.use('/api/hiring', generalLimiter, hiringRoutes);
app.use('/api/talent-pool', generalLimiter, talentPoolRoutes);
app.use("/api/ai", aiRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Allowed CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);

  // Auto-start Interview Reminder Scheduler in production
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_REMINDERS === 'true') {
    import('./utils/reminderScheduler.js').then(module => {
      module.startReminderScheduler(io, userSocketMap);
    }).catch(err => {
      console.error('Failed to start reminder scheduler:', err);
    });
  }
});