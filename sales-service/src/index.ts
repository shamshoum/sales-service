import express from 'express';
import dotenv from 'dotenv';
import { OrderRepository } from './repositories/OrderRepository';
import { InventoryService } from './services/InventoryService';
import { MessageQueueService } from './services/MessageQueueService';
import { OrderService } from './services/OrderService';
import { OrderController } from './controllers/OrderController';
import { createOrderRoutes } from './routes/orderRoutes';
import { logger } from './config/logger';
import { database } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    service: 'sales-service',
    timestamp: new Date().toISOString()
  });
});

// Initialize services
const orderRepository = new OrderRepository();
const inventoryService = new InventoryService();
const messageQueueService = new MessageQueueService();
const orderService = new OrderService(orderRepository, inventoryService, messageQueueService);
const orderController = new OrderController(orderService);
// Setup routes
app.use('/api', createOrderRoutes(orderController));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
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

// Initialize message queue and start consuming delivery updates
async function initializeMessageQueue() {
  try {
    await messageQueueService.connect();
    
    // Consume delivery status updates
    await messageQueueService.consumeDeliveryUpdates(async (event) => {
      try {
        await orderService.handleDeliveryStatusUpdate(event.order_id, event.status);
        logger.info('Successfully processed delivery status update', {
          orderId: event.order_id,
          status: event.status
        });
      } catch (error: any) {
        logger.error('Failed to process delivery status update', {
          error: error.message,
          orderId: event.order_id,
          status: event.status
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
  logger.info('Shutting down gracefully...', { service: 'sales-service' });
  
  try {
    await messageQueueService.close();
    await database.close();
    logger.info('Shutdown complete', { service: 'sales-service' });
    process.exit(0);
  } catch (error: any) {
    logger.error('Error during shutdown', { error: error.message, service: 'sales-service' });
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
      logger.info(`Sales System server started`, {
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

