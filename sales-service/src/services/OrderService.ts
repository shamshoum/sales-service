import { v4 as uuidv4 } from 'uuid';
import { OrderRepository } from '../repositories/OrderRepository';
import { InventoryService } from './InventoryService';
import { MessageQueueService } from './MessageQueueService';
import { Order, OrderStatus, OrderItem } from '../models/Order';
import { logger } from '../config/logger';

export interface CreateOrderRequest {
  customer_id: string;
  items: OrderItem[];
}

// Valid delivery statuses that can be updated from delivery service
const VALID_DELIVERY_STATUSES: OrderStatus[] = [OrderStatus.SHIPPED, OrderStatus.DELIVERED];

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private inventoryService: InventoryService,
    private messageQueueService: MessageQueueService
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    logger.info('Creating new order', { customerId: request.customer_id, itemCount: request.items.length });

    // 1. Validate input data
    this.validateOrderRequest(request);

    // 2. Check product availability
    const availabilityResult = await this.inventoryService.checkAvailability(request.items);
    logger.info('Available');
    if (!availabilityResult.available) {
      const error = new Error('Some products are not available');
      (error as any).unavailableItems = availabilityResult.unavailable_items;
      logger.warn('Order creation failed due to unavailable products', {
        unavailableItems: availabilityResult.unavailable_items
      });
      throw error;
    }
    logger.info('Available');

    // 3. Create order
    const orderId = uuidv4();
    const order: Omit<Order, 'created_at' | 'updated_at'> = {
      id: orderId,
      customer_id: request.customer_id,
      status: OrderStatus.PENDING_SHIPMENT,
      items: request.items,
      total_amount: 0
    };

    const createdOrder = await this.orderRepository.createOrder(order);

    // 5. Initiate delivery process (publish to message queue)
    try {
      await this.messageQueueService.publishOrderCreated(createdOrder);
    } catch (error: any) {
      logger.error('Failed to publish order created event, but order was created', {
        error: error.message,
        orderId: createdOrder.id
      });
      // In a production system, you might want to implement a retry mechanism
      // or store the event for later processing
    }

    logger.info('Order created successfully', { orderId: createdOrder.id });
    return createdOrder;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return await this.orderRepository.getOrderById(orderId);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    logger.info('Updating order status', { orderId, status });
    return await this.orderRepository.updateOrderStatus(orderId, status);
  }

  async handleDeliveryStatusUpdate(orderId: string, status: 'Shipped' | 'Delivered'): Promise<void> {
    logger.info('Handling delivery status update', { orderId, status });

    // Verify status is valid
    const orderStatus = status as OrderStatus;
    if (!VALID_DELIVERY_STATUSES.includes(orderStatus)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${VALID_DELIVERY_STATUSES.join(', ')}`);
    }

    // Verify order exists
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      logger.warn('Order not found for status update', { orderId });
      throw new Error(`Order ${orderId} not found`);
    }

    // Update order status
    const updated = await this.orderRepository.updateOrderStatus(orderId, orderStatus);
    if (!updated) {
      throw new Error(`Failed to update order ${orderId} status`);
    }

    logger.info('Order status updated from delivery system', { orderId, status: orderStatus });
  }

  private validateOrderRequest(request: CreateOrderRequest): void {
    if (!request.customer_id || request.customer_id.trim() === '') {
      throw new Error('customer_id is required');
    }

    if (!request.items || !Array.isArray(request.items) || request.items.length === 0) {
      throw new Error('items array is required and must not be empty');
    }

    request.items.forEach((item, index) => {
      if (!item.product_id || item.product_id.trim() === '') {
        throw new Error(`items[${index}].product_id is required`);
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`items[${index}].quantity must be a positive integer`);
      }
    });
  }
}

