import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';
import { Order } from '../models/Order';

export interface OrderCreatedEvent {
  order_id: string;
  customer_id: string;
  items: any[];
  total_amount: number;
  created_at: string;
}

export interface DeliveryStatusUpdateEvent {
  order_id: string;
  status: 'Shipped' | 'Delivered';
  updated_at: string;
}

export class MessageQueueService {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private orderCreatedQueue: string;
  private deliveryUpdatesQueue: string;
  private isConnected: boolean = false;

  constructor() {
    this.orderCreatedQueue = process.env.MQ_ORDER_CREATED_QUEUE || 'order.created';
    this.deliveryUpdatesQueue = process.env.MQ_DELIVERY_UPDATES_QUEUE || 'delivery.updates';
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.connection) {
      return;
    }

    try {
      const mqHost = process.env.MQ_HOST || 'localhost';
      const mqPort = process.env.MQ_PORT || '5672';
      const mqUsername = process.env.MQ_USERNAME || 'guest';
      const mqPassword = process.env.MQ_PASSWORD || 'guest';
      
      const connectionUrl = `amqp://${mqUsername}:${mqPassword}@${mqHost}:${mqPort}`;
      
      logger.info('Connecting to message queue', { url: connectionUrl.replace(/:[^:@]+@/, ':****@') });
      
      this.connection = await amqp.connect(connectionUrl);
      this.channel = await this.connection.createChannel();
      
      // Declare queues with message deduplication enabled
      // Requires rabbitmq_message_deduplication plugin to be enabled
      await this.channel.assertQueue(this.orderCreatedQueue, { 
        durable: true,
        arguments: {
          'x-message-deduplication': true
        }
      });
      await this.channel.assertQueue(this.deliveryUpdatesQueue, { 
        durable: true,
        arguments: {
          'x-message-deduplication': true
        }
      });
      
      this.isConnected = true;
      logger.info('Connected to message queue successfully');

      // Handle connection errors
      this.connection.on('error', (err) => {
        logger.error('Message queue connection error', { error: err.message });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('Message queue connection closed');
        this.isConnected = false;
      });
    } catch (error: any) {
      logger.error('Failed to connect to message queue', { error: error.message });
      // In development, we can continue without MQ (graceful degradation)
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      logger.warn('Continuing without message queue (development mode)');
    }
  }

  async publishOrderCreated(order: Order): Promise<void> {
    if (!this.isConnected || !this.channel) {
      logger.warn('Message queue not connected, skipping order created event', { orderId: order.id });
      return;
    }

    try {
      const event: OrderCreatedEvent = {
        order_id: order.id,
        customer_id: order.customer_id,
        items: order.items,
        total_amount: order.total_amount,
        created_at: order.created_at
      };

      const messageId = uuidv4();
      const message = Buffer.from(JSON.stringify(event));
      
      await this.channel.sendToQueue(
        this.orderCreatedQueue,
        message,
        {
          persistent: true,
          messageId: messageId,
          headers: {
            'x-deduplication-header': messageId, // Required by rabbitmq_message_deduplication plugin
            'x-order-id': order.id
          }
        }
      );

      logger.info('Published order created event', { orderId: order.id });
    } catch (error: any) {
      logger.error('Failed to publish order created event', { 
        error: error.message,
        orderId: order.id 
      });
      throw error;
    }
  }

  async consumeDeliveryUpdates(
    onStatusUpdate: (event: DeliveryStatusUpdateEvent) => Promise<void>
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      logger.warn('Message queue not connected, cannot consume delivery updates');
      return;
    }

    try {
      await this.channel.consume(
        this.deliveryUpdatesQueue,
        async (msg) => {
          if (!msg) {
            return;
          }

          try {
            const event: DeliveryStatusUpdateEvent = JSON.parse(msg.content.toString());
            const messageId = msg.properties.messageId || 
                            msg.properties.headers?.['x-deduplication-header'] || 
                            `msg-${msg.fields.deliveryTag}`;
            
            logger.info('Received delivery status update', { 
              orderId: event.order_id,
              status: event.status,
              messageId
            });

            // Duplicate detection is handled by RabbitMQ plugin at queue level
            // If message reaches here, it's not a duplicate
            await onStatusUpdate(event);
            this.channel?.ack(msg);
          } catch (error: any) {
            logger.error('Failed to process delivery status update', { 
              error: error.message 
            });
            // In production, you might want to implement dead letter queue
            this.channel?.nack(msg, false, false);
          }
        },
        { noAck: false }
      );

      logger.info('Started consuming delivery status updates');
    } catch (error: any) {
      logger.error('Failed to consume delivery updates', { error: error.message });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.isConnected = false;
    logger.info('Message queue connection closed');
  }
}

