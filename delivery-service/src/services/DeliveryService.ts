import { MessageQueueService } from './MessageQueueService';
import { DeliveryStatusUpdateEvent, OrderCreatedEvent } from '../models/Delivery';
import { logger } from '../config/logger';

export class DeliveryService {
  constructor(private messageQueueService: MessageQueueService) {}

  /**
   * Consume order created events (but don't process them - just receive)
   */
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    logger.info('Received order created event', { 
      orderId: event.order_id,
      customerId: event.customer_id
    });
    // No processing needed - just log that we received it
  }

  /**
   * Publish delivery status update event
   */
  async publishStatusUpdate(orderId: string, status: 'Shipped' | 'Delivered'): Promise<void> {
    logger.info('Publishing delivery status update', { orderId, status });

    const updateEvent: DeliveryStatusUpdateEvent = {
      order_id: orderId,
      status: status,
      updated_at: new Date().toISOString()
    };

    try {
      await this.messageQueueService.publishDeliveryStatusUpdate(updateEvent);
      logger.info('Delivery status update published successfully', { orderId, status });
    } catch (error: any) {
      logger.error('Failed to publish delivery status update', {
        error: error.message,
        orderId,
        status
      });
      throw error;
    }
  }
}
