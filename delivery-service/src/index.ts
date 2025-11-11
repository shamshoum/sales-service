import express from 'express';
import dotenv from 'dotenv';
import { MessageQueueService } from './services/MessageQueueService';
import { DeliveryService } from './services/DeliveryService';
import { DeliveryController } from './controllers/DeliveryController';
import { createDeliveryRoutes } from './routes/deliveryRoutes';
import { logger } from './config/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'delivery-service',
    timestamp: new Date().toISOString()
  });
});

// Initialize services
const messageQueueService = new MessageQueueService();
const deliveryService = new DeliveryService(messageQueueService);
const deliveryController = new DeliveryController(deliveryService);

// Setup routes
app.use('/api', createDeliveryRoutes(deliveryController));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Initialize message queue and start consuming order created events
async function initializeMessageQueue() {
  try {
    await messageQueueService.connect();
    
    // Consume order created events (but don't process them - just receive)
    await messageQueueService.consumeOrderCreated(async (event) => {
      try {
        await deliveryService.handleOrderCreated(event);
        logger.info('Successfully received order created event', {
          orderId: event.order_id
        });
      } catch (error: any) {
        logger.error('Failed to handle order created event', {
          error: error.message,
          orderId: event.order_id
        });
        throw error; // Re-throw to trigger nack
      }
    });
  } catch (error: any) {
    logger.error('Failed to initialize message queue', { error: error.message });
    // Continue without MQ in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  
  try {
    await messageQueueService.close();
    process.exit(0);
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    // Initialize message queue
    await initializeMessageQueue();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Delivery Service server started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

start();
