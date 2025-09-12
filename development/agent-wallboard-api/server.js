// server.js - Main application server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const {
  globalErrorHandler,
  notFoundHandler,
  performanceMonitor
} = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

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

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Agent Wallboard API Enhanced v1.0',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    health: '/api/health',
    endpoints: {
      agents: '/api/agents',
      health: '/api/health',
      docs: '/api/docs'
    }
  });
});

app.use('/api', routes);

// 🔧 FIXED: Catch-all 404 handler (no wildcard path)
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

const server = app.listen(PORT, () => {
  console.log('🚀 Agent Wallboard API Enhanced');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = app;
