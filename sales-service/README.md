# Sales System - Order Processing Integration

This is the Sales System implementation for the Order Processing Integration project. It handles order creation, status tracking, and integration with the Delivery system.

## Features

- **Order Creation**: Secure API endpoint to receive and process customer orders
- **Product Availability Check**: Validates product availability before order confirmation
- **Order Management**: Stores and tracks order information with status history
- **Delivery Integration**: Publishes order creation events and consumes delivery status updates
- **Reliability**: Message queue integration for reliable event processing
- **Observability**: Comprehensive logging and health check endpoints

## Architecture

The system follows a layered architecture:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic (OrderService, InventoryService, MessageQueueService)
- **Repositories**: Data access layer (OrderRepository)
- **Models**: Data structures and types
- **Routes**: API route definitions with validation

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- SQLite3 (included with Node.js)
- RabbitMQ (optional, for message queue functionality)

## Installation

1. Clone the repository and navigate to the sales-service directory:
```bash
cd sales-service
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env` (see Configuration section)

## Configuration

The following environment variables can be configured:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DB_PATH`: SQLite database file path (default: ./data/sales.db)
- `MQ_HOST`: RabbitMQ host (default: localhost)
- `MQ_PORT`: RabbitMQ port (default: 5672)
- `MQ_USERNAME`: RabbitMQ username (default: guest)
- `MQ_PASSWORD`: RabbitMQ password (default: guest)
- `MQ_ORDER_CREATED_QUEUE`: Queue name for order creation events
- `MQ_DELIVERY_UPDATES_QUEUE`: Queue name for delivery status updates
- `INVENTORY_SERVICE_URL`: Inventory service URL (for mocking)
- `LOG_LEVEL`: Logging level (default: info)

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the server with hot-reload using `ts-node-dev`.

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

### Using Docker

1. Build the Docker image:
```bash
docker build -t sales-service .
```

2. Run the container:
```bash
docker run -p 3000:3000 -v $(pwd)/data:/app/data sales-service
```

## API Endpoints

### Health Check

```
GET /health
```

Returns the health status of the service.

### Create Order

```
POST /api/orders
Content-Type: application/json

{
  "customer_id": "customer-123",
  "items": [
    {
      "product_id": "product-1",
      "quantity": 2,
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": "uuid-here",
    "status": "Pending Shipment",
    "total_amount": 59.98
  }
}
```

### Get Order

```
GET /api/orders/:orderId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-id",
    "customer_id": "customer-123",
    "status": "Pending Shipment",
    "items": [...],
    "total_amount": 59.98,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Order Status (Admin/Testing)

```
PATCH /api/orders/:orderId/status
Content-Type: application/json

{
  "status": "Shipped"
}
```

### Delivery Status Update

```
POST /api/delivery/status-update
Content-Type: application/json

{
  "order_id": "order-id",
  "status": "Shipped",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

This endpoint is used by the Delivery system to send status updates.

## Order Status Flow

1. **Pending Shipment**: Initial status when order is created
2. **Shipped**: Updated by Delivery system when order is shipped
3. **Delivered**: Updated by Delivery system when order is delivered

## Message Queue Integration

The system uses RabbitMQ for reliable event processing:

- **Order Created Events**: Published to `order.created` queue when an order is created
- **Delivery Status Updates**: Consumed from `delivery.updates` queue

If RabbitMQ is not available, the system will continue to function (with logging warnings) in development mode. In production, the service will fail to start if it cannot connect to the message queue.

## Database Schema

### Orders Table

- `id`: TEXT (Primary Key, UUID)
- `customer_id`: TEXT (Required)
- `status`: TEXT (Pending Shipment, Shipped, Delivered)
- `items`: TEXT (JSON array of order items)
- `total_amount`: REAL (Required)
- `created_at`: DATETIME
- `updated_at`: DATETIME

### Order Status History Table

- `id`: INTEGER (Primary Key, Auto-increment)
- `order_id`: TEXT (Foreign Key to orders.id)
- `status`: TEXT
- `changed_at`: DATETIME

## Testing

### Manual Testing with cURL

1. Create an order:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-123",
    "items": [
      {
        "product_id": "product-1",
        "quantity": 2
      }
    ]
  }'
```

2. Get the order (replace `ORDER_ID` with the ID from step 1):
```bash
curl http://localhost:3000/api/orders/ORDER_ID
```

3. Simulate delivery status update:
```bash
curl -X POST http://localhost:3000/api/delivery/status-update \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_ID",
    "status": "Shipped"
  }'
```

## Assumptions and Design Decisions

1. **Inventory Service**: Currently mocked. In production, this would call an external inventory service via HTTP/gRPC.

2. **Message Queue**: Uses RabbitMQ but gracefully degrades in development mode if unavailable. In production, the service requires MQ connectivity.

3. **Database**: Uses SQLite for simplicity. In production, this would be replaced with PostgreSQL or another production-grade database.

4. **Idempotency**: Order creation events are published to the message queue. The system does not implement idempotency keys in this version, but this should be added for production.

5. **Security**: The API does not implement authentication/authorization in this version. In production, this should be added (e.g., API keys, JWT tokens).

6. **Error Handling**: Comprehensive error handling with appropriate HTTP status codes and error messages.

7. **Logging**: Structured logging using Winston for observability.

## Project Structure

```
sales-service/
├── src/
│   ├── config/
│   │   ├── database.ts      # Database connection and schema
│   │   └── logger.ts         # Logging configuration
│   ├── controllers/
│   │   └── OrderController.ts
│   ├── middleware/
│   │   └── validation.ts
│   ├── models/
│   │   └── Order.ts          # Order data models
│   ├── repositories/
│   │   └── OrderRepository.ts
│   ├── routes/
│   │   ├── orderRoutes.ts
│   │   └── deliveryRoutes.ts
│   ├── services/
│   │   ├── InventoryService.ts
│   │   ├── MessageQueueService.ts
│   │   └── OrderService.ts
│   └── index.ts              # Application entry point
├── data/                     # SQLite database files (gitignored)
├── dist/                     # Compiled JavaScript (gitignored)
├── .env.example
├── .gitignore
├── Dockerfile
├── package.json
├── README.md
└── tsconfig.json
```

## Troubleshooting

### Database Issues

If you encounter database permission errors, ensure the `data/` directory exists and is writable:
```bash
mkdir -p data
chmod 755 data
```

### Message Queue Connection Issues

If RabbitMQ is not running, the service will log warnings but continue in development mode. To use message queue features:

1. Install and start RabbitMQ:
```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

2. Access management UI at http://localhost:15672 (guest/guest)

### Port Already in Use

If port 3000 is already in use, change the `PORT` environment variable in `.env`.

## Future Enhancements

- [ ] Add authentication/authorization
- [ ] Implement idempotency keys for order creation
- [ ] Add retry mechanism for message queue operations
- [ ] Implement dead letter queue for failed messages
- [ ] Add comprehensive unit and integration tests
- [ ] Add API rate limiting
- [ ] Implement caching for frequently accessed orders
- [ ] Add metrics and monitoring dashboards

## License

ISC

