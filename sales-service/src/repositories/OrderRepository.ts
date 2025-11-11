import { database } from '../config/database';
import { Order, OrderStatus, OrderItem, OrderStatusHistory } from '../models/Order';
import { logger } from '../config/logger';

export class OrderRepository {
  async createOrder(order: Omit<Order, 'created_at' | 'updated_at'>): Promise<Order> {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const itemsJson = JSON.stringify(order.items);
      const self = this;
      
      const query = `
        INSERT INTO orders (id, customer_id, status, items, total_amount, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      db.run(
        query,
        [order.id, order.customer_id, order.status, itemsJson, order.total_amount],
        function(err: Error | null) {
          if (err) {
            logger.error('Failed to create order', { error: err.message, orderId: order.id });
            reject(err);
            return;
          }

          // Record status history
          self.addStatusHistory(order.id, order.status)
            .then(() => {
              logger.info('Order created successfully', { orderId: order.id });
              resolve({
                ...order,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            })
            .catch(reject);
        }
      );
    });
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = 'SELECT * FROM orders WHERE id = ?';

      db.get(query, [orderId], (err, row: any) => {
        if (err) {
          logger.error('Failed to get order', { error: err.message, orderId });
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        const order: Order = {
          id: row.id,
          customer_id: row.customer_id,
          status: row.status as OrderStatus,
          items: JSON.parse(row.items) as OrderItem[],
          total_amount: row.total_amount,
          created_at: row.created_at,
          updated_at: row.updated_at
        };

        resolve(order);
      });
    });
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const self = this;
      const query = `
        UPDATE orders 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `;

      db.run(query, [newStatus, orderId], async function(this: { changes: number }, err: Error | null) {
        if (err) {
          logger.error('Failed to update order status', { error: err.message, orderId, newStatus });
          reject(err);
          return;
        }

        if (this.changes === 0) {
          logger.warn('Order not found for status update', { orderId });
          resolve(false);
          return;
        }

        try {
          await self.addStatusHistory(orderId, newStatus);
          logger.info('Order status updated', { orderId, newStatus });
          resolve(true);
        } catch (historyErr) {
          reject(historyErr);
        }
      });
    });
  }

  async addStatusHistory(orderId: string, status: OrderStatus): Promise<void> {
    return new Promise((resolve, reject) => {
      const db = database.getDatabase();
      const query = `
        INSERT INTO order_status_history (order_id, status, changed_at)
        VALUES (?, ?, datetime('now'))
      `;

      db.run(query, [orderId, status], (err) => {
        if (err) {
          logger.error('Failed to add status history', { error: err.message, orderId, status });
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

