import { Request, Response } from 'express';
import { DeliveryService } from '../services/DeliveryService';
import { logger } from '../config/logger';

export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  async updateDeliveryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!status || !['Shipped', 'Delivered'].includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status. Must be "Shipped" or "Delivered"'
        });
        return;
      }

      // Publish status update event
      await this.deliveryService.publishStatusUpdate(orderId, status);

      res.json({
        success: true,
        message: `Delivery status update published for order ${orderId}`,
        data: {
          order_id: orderId,
          status: status,
          updated_at: new Date().toISOString()
        }
      });
    } catch (error: any) {
      logger.error('Failed to publish delivery status update', { 
        error: error.message,
        orderId: req.params.orderId 
      });

      res.status(500).json({
        success: false,
        error: 'Failed to publish delivery status update'
      });
    }
  }
}
