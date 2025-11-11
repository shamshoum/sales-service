import { Product, AvailabilityCheckItem, AvailabilityCheckResult } from '../models/Product';
import { logger } from '../config/logger';

// In-memory product list
const PRODUCTS: Product[] = [
  { id: 'product-1', name: 'Laptop Computer', stock_quantity: 50 },
  { id: 'product-2', name: 'Wireless Mouse', stock_quantity: 200 },
  { id: 'product-3', name: 'Mechanical Keyboard', stock_quantity: 75 },
  { id: 'product-4', name: 'Monitor 27"', stock_quantity: 30 },
  { id: 'product-5', name: 'USB-C Hub', stock_quantity: 150 },
  { id: 'product-6', name: 'Webcam HD', stock_quantity: 100 },
  { id: 'product-7', name: 'Desk Chair', stock_quantity: 25 },
  { id: 'product-8', name: 'Standing Desk', stock_quantity: 15 },
  { id: 'product-9', name: 'Noise Cancelling Headphones', stock_quantity: 60 },
  { id: 'product-10', name: 'External SSD 1TB', stock_quantity: 80 },
  { id: 'out-of-stock-product', name: 'Discontinued Item', stock_quantity: 0 }
];

export class InventoryService {
  async checkAvailability(items: AvailabilityCheckItem[]): Promise<AvailabilityCheckResult> {
    logger.info('Checking availability for items', { itemCount: items.length });

    const unavailableItems: Array<{
      product_id: string;
      requested_quantity: number;
      available_quantity: number;
    }> = [];

    // Check each item
    for (const item of items) {
      const product = PRODUCTS.find(p => p.id === item.product_id);
      
      if (!product) {
        logger.warn('Product not found', { productId: item.product_id });
        unavailableItems.push({
          product_id: item.product_id,
          requested_quantity: item.quantity,
          available_quantity: 0
        });
        continue;
      }

      if (product.stock_quantity < item.quantity) {
        logger.warn('Insufficient stock', {
          productId: item.product_id,
          requested: item.quantity,
          available: product.stock_quantity
        });
        unavailableItems.push({
          product_id: item.product_id,
          requested_quantity: item.quantity,
          available_quantity: product.stock_quantity
        });
      }
    }

    const result: AvailabilityCheckResult = {
      available: unavailableItems.length === 0,
      ...(unavailableItems.length > 0 && { unavailable_items: unavailableItems })
    };

    logger.info('Availability check completed', {
      available: result.available,
      unavailableCount: unavailableItems.length
    });

    return result;
  }

  getProduct(productId: string): Product | null {
    return PRODUCTS.find(p => p.id === productId) || null;
  }

  getAllProducts(): Product[] {
    return PRODUCTS;
  }
}
