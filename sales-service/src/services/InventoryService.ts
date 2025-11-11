import { logger } from '../config/logger';
import { OrderItem } from '../models/Order';

export interface AvailabilityCheckResult {
  available: boolean;
  unavailable_items?: Array<{
    product_id: string;
    requested_quantity: number;
    available_quantity: number;
  }>;
}

export class InventoryService {
  private inventoryServiceUrl: string;
  private timeout: number;
  private authToken: string;

  constructor() {
    this.inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3001';
    this.timeout = parseInt(process.env.INVENTORY_SERVICE_TIMEOUT || '5000', 10);
    this.authToken = process.env.INVENTORY_SERVICE_TOKEN || 'inventory-service-secret-token-12345';
  }

  /**
   * Check product availability by calling the inventory service
   */
  async checkAvailability(items: OrderItem[]): Promise<AvailabilityCheckResult> {
    logger.info('Checking product availability', { itemCount: items.length, serviceUrl: this.inventoryServiceUrl });

    try {
      // Prepare request body
      const requestBody = {
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      // Create AbortController for timeout
      const controller = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;
      
      // Set timeout only if timeout is greater than 0
      if (this.timeout > 0) {
        timeoutId = setTimeout(() => {
          logger.warn('Inventory service request timeout, aborting', { timeout: this.timeout });
          controller.abort();
        }, this.timeout);
      }

      // Make HTTP request to inventory service
      const response = await fetch(`${this.inventoryServiceUrl}/api/inventory/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.authToken
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Inventory service returned error', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error('Inventory service authentication failed');
        }

        if (response.status === 400) {
          throw new Error(`Invalid request to inventory service: ${errorText}`);
        }

        throw new Error(`Inventory service error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as { success: boolean; error?: string; data?: AvailabilityCheckResult };

      if (!result.success) {
        logger.error('Inventory service returned unsuccessful response', { result });
        throw new Error(result.error || 'Inventory service check failed');
      }

      if (!result.data) {
        throw new Error('Inventory service returned success but no data');
      }

      const availabilityResult: AvailabilityCheckResult = result.data;

      logger.info('Availability check completed', {
        available: availabilityResult.available,
        unavailableCount: availabilityResult.unavailable_items?.length || 0
      });

      return availabilityResult;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.error('Inventory service request timeout', {
          timeout: this.timeout,
          serviceUrl: this.inventoryServiceUrl
        });
        throw new Error('Inventory service request timeout');
      }

      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        logger.error('Failed to connect to inventory service', {
          error: error.message,
          serviceUrl: this.inventoryServiceUrl
        });
        throw new Error('Inventory service unavailable - connection failed');
      }

      logger.error('Failed to check inventory availability', {
        error: error.message
      });

      throw error;
    }
  }
}

