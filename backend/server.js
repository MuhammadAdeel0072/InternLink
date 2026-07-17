
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import './config/passport.js'; // Initialize Passport strategies
import { Server } from 'socket.io';
import cors from 'cors';

import passport from 'passport';
console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
console.log("Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET);
console.log("GitHub Client ID:", process.env.GITHUB_CLIENT_ID);
console.log("GitHub Client Secret:", process.env.GITHUB_CLIENT_SECRET);
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import postRoutes from './routes/postRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';


// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

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
});