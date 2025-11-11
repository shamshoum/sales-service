import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { logger } from '../config/logger';

export class OrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const order = await this.orderService.createOrder(req.body);
      
      res.status(201).json({
        success: true,
        data: {
          order_id: order.id,
          status: order.status,
          total_amount: order.total_amount
        }
      });
    } catch (error: any) {
      logger.error('Failed to create order', { error: error.message });

      if (error.message.includes('not available')) {
        const unavailableItems = (error as any).unavailableItems;
        res.status(400).json({
          success: false,
          error: 'Some products are not available',
          unavailable_items: unavailableItems
        });
        return;
      }

      if (error.message.includes('Inventory service')) {
        res.status(503).json({
          success: false,
          error: 'Inventory service is currently unavailable. Please try again later.'
        });
        return;
      }

      if (error.message.includes('required') || error.message.includes('must be')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const order = await this.orderService.getOrder(orderId);

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found'
        });
        return;
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      logger.error('Failed to get order', { error: error.message, orderId: req.params.orderId });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

}

