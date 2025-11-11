import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';
import { OrderCreatedEvent, DeliveryStatusUpdateEvent } from '../models/Delivery';

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

  async consumeOrderCreated(
    onOrderCreated: (event: OrderCreatedEvent) => Promise<void>
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      logger.warn('Message queue not connected, cannot consume order created events');
      return;
    }

    try {
      await this.channel.consume(
        this.orderCreatedQueue,
        async (msg) => {
          if (!msg) {
            return;
          }

          try {
            const event: OrderCreatedEvent = JSON.parse(msg.content.toString());
            const messageId = msg.properties.messageId || 
                            msg.properties.headers?.['x-deduplication-header'] || 
                            `msg-${msg.fields.deliveryTag}`;
            
            logger.info('Received order created event', { 
              orderId: event.order_id,
              customerId: event.customer_id,
              messageId
            });

            // Duplicate detection is handled by RabbitMQ plugin at queue level
            // If message reaches here, it's not a duplicate
            await onOrderCreated(event);
            this.channel?.ack(msg);
          } catch (error: any) {
            logger.error('Failed to process order created event', { 
              error: error.message 
            });
            // In production, you might want to implement dead letter queue
            this.channel?.nack(msg, false, false);
          }
        },
        { noAck: false }
      );

      logger.info('Started consuming order created events');
    } catch (error: any) {
      logger.error('Failed to consume order created events', { error: error.message });
      throw error;
    }
  }

  async publishDeliveryStatusUpdate(event: DeliveryStatusUpdateEvent): Promise<void> {
    if (!this.isConnected || !this.channel) {
      logger.warn('Message queue not connected, skipping delivery status update event', { orderId: event.order_id });
      return;
    }

    try {
      const messageId = uuidv4();
      const message = Buffer.from(JSON.stringify(event));
      
      await this.channel.sendToQueue(
        this.deliveryUpdatesQueue,
        message,
        {
          persistent: true,
          messageId: messageId,
          headers: {
            'x-deduplication-header': messageId, // Required by rabbitmq_message_deduplication plugin
            'x-order-id': event.order_id
          }
        }
      );

      logger.info('Published delivery status update event', { 
        orderId: event.order_id,
        status: event.status 
      });
    } catch (error: any) {
      logger.error('Failed to publish delivery status update event', { 
        error: error.message,
        orderId: event.order_id 
      });
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

