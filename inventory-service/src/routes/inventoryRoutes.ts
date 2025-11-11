import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { InventoryController } from '../controllers/InventoryController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

export function createInventoryRoutes(inventoryController: InventoryController): Router {
  // All routes require authentication
  // Note: authenticateToken checks for aborted requests internally
  router.use(authenticateToken);

  // Check availability endpoint
  router.post(
    '/inventory/check',
    [
      body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
      body('items.*.product_id').notEmpty().withMessage('product_id is required for each item'),
      body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer')
    ],
    validateRequest,
    (req: Request, res: Response, next: NextFunction) => {
      inventoryController.checkAvailability(req, res).catch(next);
    }
  );

  // Get product by ID
  router.get(
    '/inventory/products/:productId',
    [
      param('productId').notEmpty().withMessage('productId is required')
    ],
    validateRequest,
    (req: Request, res: Response, next: NextFunction) => {
      inventoryController.getProduct(req, res).catch(next);
    }
  );

  // Get all products
  router.get(
    '/inventory/products',
    validateRequest,
    (req: Request, res: Response, next: NextFunction) => {
      inventoryController.getAllProducts(req, res).catch(next);
    }
  );

  return router;
}

