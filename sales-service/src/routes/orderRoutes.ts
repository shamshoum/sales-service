import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { OrderController } from '../controllers/OrderController';
import { validateRequest } from '../middleware/validation';

const router = Router();

export function createOrderRoutes(orderController: OrderController): Router {
  // Create order endpoint
  router.post(
    '/orders',
    [
      body('customer_id').notEmpty().withMessage('customer_id is required'),
      body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
      body('items.*.product_id').notEmpty().withMessage('product_id is required for each item'),
      body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer')
    ],
    validateRequest,
    (req: Request, res: Response, next: NextFunction) => {
      orderController.createOrder(req, res).catch(next);
    }
  );

  // Get order by ID
  router.get(
    '/orders/:orderId',
    [
      param('orderId').notEmpty().withMessage('orderId is required')
    ],
    validateRequest,
    (req: Request, res: Response, next: NextFunction) => {
      orderController.getOrder(req, res).catch(next);
    }
  );

  return router;
}

