// server.js - Main application server with WebSocket Support
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const apiRoutes = require('./routes'); // ✅ ใช้ index.js
require('dotenv').config();

// 🚀 WebSocket
const http = require('http');
const socketIo = require('socket.io');

const {
  globalErrorHandler,
  notFoundHandler,
  performanceMonitor
} = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app); // 👈 ใช้สำหรับ WebSocket
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH']
  }
});

// 🌍 ทำให้ io ใช้ได้ใน controller ผ่าน req.app.get('io')
app.set('io', io);

// ✅ เชื่อม MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentdb';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB:', MONGO_URI))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Express Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(performanceMonitor);

// ✅ API Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Agent Wallboard API Enhanced v1.0 with WebSocket',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/api/health',
    endpoints: {
      agents: '/api/agents',
      messages: '/api/messages',
      health: '/api/health',
      docs: '/api/docs'
    }
  });
});

// ✅ แก้ไขแล้ว: ใช้เพียง 1 บรรทัด
app.use('/api', apiRoutes);
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ✅ WebSocket Logic
io.on('connection', (socket) => {
  console.log(`⚡ New client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log('🚀 Agent Wallboard API Enhanced (with WebSocket)');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 🛑 Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = app;
