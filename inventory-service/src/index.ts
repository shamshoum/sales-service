import express from 'express';
import dotenv from 'dotenv';
import { InventoryService } from './services/InventoryService';
import { InventoryController } from './controllers/InventoryController';
import { createInventoryRoutes } from './routes/inventoryRoutes';
import { logger } from './config/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Increase body size limit and add timeout handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle aborted requests gracefully - must be before other middleware
app.use((req, res, next) => {
  req.on('aborted', () => {
    logger.debug('Request aborted by client', { path: req.path, method: req.method });
  });
  
  req.on('close', () => {
    if ((req as any).aborted) {
      logger.debug('Request connection closed', { path: req.path });
    }
  });
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'inventory-service',
    timestamp: new Date().toISOString()
  });
});

// Initialize services
const inventoryService = new InventoryService();
const inventoryController = new InventoryController(inventoryService);

// Setup routes
app.use('/api', createInventoryRoutes(inventoryController));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Don't send response if request was aborted or connection closed
  if ((req as any).aborted || req.destroyed || res.headersSent) {
    logger.warn('Request aborted or response already sent', {
      error: err.message,
      path: req.path
    });
    return;
  }

  // Handle specific error types
  if (err.message.includes('request aborted') || err.message.includes('aborted')) {
    logger.warn('Request was aborted by client', {
      path: req.path,
      method: req.method
    });
    return; // Don't send response for aborted requests
  }

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

// Start server
app.listen(PORT, () => {
  const products = inventoryService.getAllProducts();
  logger.info(`Inventory Service server started`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    productCount: products.length
  });
  logger.info(`Authentication token: ${process.env.AUTH_TOKEN || 'inventory-service-secret-token-12345'}`);
  logger.info(`Loaded ${products.length} products in memory`);
});
