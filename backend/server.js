
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import './config/passport.js'; // Initialize Passport strategies
import { Server } from 'socket.io';
import cors from 'cors';

import passport from 'passport';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

import jobAlertRoutes from './routes/jobAlertRoutes.js';
import recruiterProfileRoutes from './routes/recruiterProfileRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import recruiterDashboardRoutes from './routes/recruiterDashboardRoutes.js';


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

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
    }
  });

  socket.on('send_notification_alert', ({ recipientId, notification }) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_notification', notification);
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

// Express Middlewares
app.use(helmet());
app.use(mongoSanitize());

app.use(cors({
  origin: (origin, callback) => {
    const isDev = process.env.NODE_ENV !== 'production';
    if (!origin || allowedOrigins.includes(origin) || (isDev && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Mount API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/recruiter/jobs', recruiterJobRoutes);
app.use('/api/job-alerts', jobAlertRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recruiter', recruiterProfileRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/recruiter/dashboard', recruiterDashboardRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/offers', offerRoutes);

// Root Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'InternLink Backend Server running smoothly',
    timestamp: new Date().toISOString(),
  });
});

// Error handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

  // Auto-start Interview Reminder Scheduler in production
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_REMINDERS === 'true') {
    import('./utils/reminderScheduler.js').then(module => {
      module.startReminderScheduler(io, userSocketMap);
    }).catch(err => {
      console.error('Failed to start reminder scheduler:', err);
    });
  }
});