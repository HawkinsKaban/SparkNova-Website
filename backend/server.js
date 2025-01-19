const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const mqttService = require('./services/mqttService');

class Server {
  constructor() {
    this.app = express();
    // Inisialisasi server HTTP setelah app
    this.server = http.createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  async start() {
    try {
      // Connect to database
      await connectDB();
      console.log('✅ MongoDB Connected');

      // Initialize MQTT service
      await mqttService.init();
      console.log('✅ MQTT Service Ready');

      const PORT = process.env.PORT || 5000;

      // Pastikan this.server sudah diinisialisasi
      if (!this.server) {
        this.server = http.createServer(this.app);
      }

      // Start server
      return new Promise((resolve) => {
        this.server.listen(PORT, () => {
          console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
          console.log(`🔗 API URL: http://localhost:${PORT}/api/v1`);
          resolve();
        });
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Server startup error:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: [process.env.CLIENT_URL, 'https://sparknova-ju3z6bxef-rays-projects-b1823648.vercel.app'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Security middleware
    this.app.use(mongoSanitize());
    this.app.use(xss());
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: {
        success: false,
        message: 'Too many requests, please try again later'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.app.use('/api/', limiter);

    // Body parsers
    this.app.use(express.json({ 
      limit: process.env.MAX_REQUEST_SIZE || '10mb'
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: process.env.MAX_REQUEST_SIZE || '10mb'
    }));

    // Logging in development
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }
  }

  setupRoutes() {
    // API routes
    this.app.use('/api/v1', routes);

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const mongoStatus = mongoose.connection.readyState === 1;
      const mqttStatus = mqttService.isConnected;

      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        services: {
          mongodb: mongoStatus,
          mqtt: mqttStatus
        }
      });
    });

    // Handle 404 routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Connect to database
      await connectDB();
      console.log('✅ MongoDB Connected');

      // Initialize MQTT service
      await mqttService.init();
      console.log('✅ MQTT Service Ready');

      const PORT = process.env.PORT || 5000;

      // Start server
      this.server.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        console.log(`🔗 API URL: http://localhost:${PORT}/api/v1`);
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Server startup error:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);
      
      try {
        // Close HTTP server
        await new Promise((resolve) => {
          this.server.close(() => {
            console.log('✅ HTTP server closed');
            resolve();
          });
        });

        // Disconnect MQTT
        mqttService.disconnect();
        console.log('✅ MQTT service disconnected');

        // Close MongoDB connection
        await mongoose.connection.close(false);
        console.log('✅ MongoDB connection closed');

        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Shutdown signal handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));


    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown('Uncaught Exception');
    });

    process.on('unhandledRejection', (error) => {
      console.error('❌ Unhandled Rejection:', error);
      shutdown('Unhandled Rejection');
    });
  }
}

// Modifikasi cara start server
const server = new Server();

// Untuk development (local)
if (process.env.NODE_ENV !== 'production') {
  server.start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Export untuk Vercel
module.exports = server.app;