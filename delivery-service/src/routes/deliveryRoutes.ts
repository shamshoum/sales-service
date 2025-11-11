import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { DeliveryController } from '../controllers/DeliveryController';
import { validateRequest } from '../middleware/validation';

const router = Router();

export function createDeliveryRoutes(deliveryController: DeliveryController): Router {
  // Update delivery status endpoint
  router.post(
    '/delivery/:orderId/status',
    [
      param('orderId').notEmpty().withMessage('orderId is required'),
      body('status').notEmpty().withMessage('status is required')
        .isIn(['Shipped', 'Delivered']).withMessage('status must be "Shipped" or "Delivered"')
    ],
    validateRequest,
    (req: Request, res: Response, next: NextFunction) => {
      deliveryController.updateDeliveryStatus(req, res).catch(next);
    }
  );

  return router;
}
