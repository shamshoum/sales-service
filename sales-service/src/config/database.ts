import sqlite3 from 'sqlite3';
import path from 'path';
import { logger } from './logger';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/sales.db');

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logger.error('Failed to connect to database', { error: err.message });
        throw err;
      }
      logger.info('Connected to SQLite database', { path: DB_PATH });
      this.initializeSchema();
    });
  }

  private initializeSchema(): void {
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending Shipment',
        items TEXT NOT NULL,
        total_amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createOrderStatusHistoryTable = `
      CREATE TABLE IF NOT EXISTS order_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        status TEXT NOT NULL,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `;

    this.db.serialize(() => {
      this.db.run(createOrdersTable, (err) => {
        if (err) {
          logger.error('Failed to create orders table', { error: err.message });
        } else {
          logger.info('Orders table initialized');
        }
      });

      this.db.run(createOrderStatusHistoryTable, (err) => {
        if (err) {
          logger.error('Failed to create order_status_history table', { error: err.message });
        } else {
          logger.info('Order status history table initialized');
        }
      });
    });
  }

  getDatabase(): sqlite3.Database {
    return this.db;
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          logger.error('Failed to close database', { error: err.message });
          reject(err);
        } else {
          logger.info('Database connection closed', { 
            service: 'sales-service',
            reason: 'graceful shutdown'
          });
          resolve();
        }
      });
    });
  }
}

export const database = new Database();

