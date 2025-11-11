import { Request, Response } from 'express';
import { InventoryService } from '../services/InventoryService';
import { logger } from '../config/logger';

export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  async checkAvailability(req: Request, res: Response): Promise<void> {

    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          error: 'items array is required and must not be empty'
        });
        return;
      }

      // Validate items structure
      for (const item of items) {
        if (!item.product_id || typeof item.product_id !== 'string') {
          res.status(400).json({
            success: false,
            error: 'Each item must have a valid product_id'
          });
          return;
        }

        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          res.status(400).json({
            success: false,
            error: 'Each item must have a positive integer quantity'
          });
          return;
        }
      }

      const result = await this.inventoryService.checkAvailability(items);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      // Don't send response if request was aborted
      if ((req as any).aborted || req.destroyed || res.headersSent) {
        logger.warn('Request aborted, skipping error response');
        return;
      }

      logger.error('Failed to check availability', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const product = this.inventoryService.getProduct(productId);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error: any) {
      logger.error('Failed to get product', { error: error.message, productId: req.params.productId });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = this.inventoryService.getAllProducts();

      res.json({
        success: true,
        data: products
      });
    } catch (error: any) {
      logger.error('Failed to get all products', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
