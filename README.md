# Quick Start Guide

## Setup

Run the setup script to create necessary folders, `.env` files, and install dependencies:

```bash
./setup.sh
```

This will:
- Create `sales-service/data/` directory
- Copy `env.example` to `.env` for all services
- Run `npm install` in all services

## Running the Project

### Option 1: Docker Compose (Recommended)

Start all services with Docker:

```bash
docker compose -f docker-compose.all.yml up --build
```

Or run in detached mode:

```bash
docker compose -f docker-compose.all.yml up -d --build
```

Services will be available at:
- **Sales Service**: http://localhost:3000
- **Inventory Service**: http://localhost:3001
- **Delivery Service**: http://localhost:3002
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

### Option 2: Manual (Development)

Start each service manually in separate terminals:

```bash
# Terminal 1 - Sales Service
cd sales-service && npm run dev

# Terminal 2 - Inventory Service
cd inventory-service && npm run dev

# Terminal 3 - Delivery Service
cd delivery-service && npm run dev
```

**Note**: Make sure RabbitMQ is running before starting services.

## Testing

### Health Checks

```bash
curl http://localhost:3000/health  # Sales Service
curl http://localhost:3001/health  # Inventory Service
curl http://localhost:3002/health  # Delivery Service
```

### Create an Order

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

### Update Delivery Status

```bash
curl -X POST http://localhost:3002/api/delivery/{orderId}/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Shipped"
  }'
```

## View Logs

```bash
# Docker Compose
docker compose -f docker-compose.all.yml logs -f

# Individual service
docker logs sales-service -f
```

## Test Scripts

The `Tests/` directory contains shell scripts for automated testing:
- `test-sales-service.sh` - Tests order creation and retrieval
- `test-inventory-service.sh` - Tests inventory availability checks
- `test-delivery-status.sh` - Tests delivery status updates

Run them individually or all together after starting the services.

