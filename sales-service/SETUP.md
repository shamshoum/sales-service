# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` if needed (defaults should work for development).

3. **Create Data Directory**
   ```bash
   mkdir -p data
   ```

4. **Start RabbitMQ (Optional but Recommended)**
   ```bash
   docker-compose up -d rabbitmq
   ```
   This will start RabbitMQ on port 5672 with management UI on port 15672.
   Access management UI at: http://localhost:15672 (guest/guest)

5. **Run the Application**
   
   Development mode (with hot-reload):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm run build
   npm start
   ```

6. **Verify Installation**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"healthy","service":"sales-service",...}`

## Testing the API

### Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-123",
    "items": [
      {
        "product_id": "product-1",
        "quantity": 2,
      }
    ]
  }'
```

### Get Order Details
```bash
# Replace ORDER_ID with the order_id from the create response
curl http://localhost:3000/api/orders/ORDER_ID
```

### Simulate Delivery Status Update
```bash
curl -X POST http://localhost:3000/api/delivery/status-update \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER_ID",
    "status": "Shipped"
  }'
```

## Troubleshooting

### Port Already in Use
Change the `PORT` in `.env` file.

### Database Permission Errors
Ensure the `data/` directory exists and is writable:
```bash
mkdir -p data
chmod 755 data
```

### RabbitMQ Connection Issues
The service will work without RabbitMQ in development mode, but message queue features won't work. To use RabbitMQ:
```bash
docker-compose up -d rabbitmq
```

Wait a few seconds for RabbitMQ to start, then restart the sales system.

