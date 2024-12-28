// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const { emailService } = require('./services');  // Update import path

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure trust proxy for Vercel
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS), 
  max: parseInt(process.env.RATE_LIMIT_MAX),
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
});

app.use(limiter);

// Request size limits
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_REQUEST_SIZE }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

// Handle unhandled routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Initialize services and start server
const initializeServices = async () => {
  try {
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB Connected');

    // Verify email service
    console.log('📧 Verifying email service...');
    await emailService.verifyConnection();
    console.log('✅ Email service verified');
    
    return true;
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    // Initialize all services
    const servicesInitialized = await initializeServices();
    if (!servicesInitialized) {
      console.error('❌ Failed to initialize services');
      process.exit(1);
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Error Handlers
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();