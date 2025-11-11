#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setting up all services${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Create data folder for sales-service
echo -e "${YELLOW}1. Creating data folder for sales-service...${NC}"
SALES_DATA_DIR="$SCRIPT_DIR/sales-service/data"
if [ ! -d "$SALES_DATA_DIR" ]; then
  mkdir -p "$SALES_DATA_DIR"
  echo -e "${GREEN}✓ Created $SALES_DATA_DIR${NC}"
else
  echo -e "${YELLOW}✓ Data folder already exists: $SALES_DATA_DIR${NC}"
fi
echo ""

# 2. Create .env files from env.example
echo -e "${YELLOW}2. Creating .env files from env.example...${NC}"

# Sales System
SALES_ENV="$SCRIPT_DIR/sales-service/.env"
SALES_ENV_EXAMPLE="$SCRIPT_DIR/sales-service/env.example"
if [ ! -f "$SALES_ENV" ]; then
  if [ -f "$SALES_ENV_EXAMPLE" ]; then
    cp "$SALES_ENV_EXAMPLE" "$SALES_ENV"
    echo -e "${GREEN}✓ Created $SALES_ENV${NC}"
  else
    echo -e "${RED}✗ env.example not found for sales-service${NC}"
  fi
else
  echo -e "${YELLOW}✓ .env already exists for sales-service (skipping)${NC}"
fi

# Inventory Service
INVENTORY_ENV="$SCRIPT_DIR/inventory-service/.env"
INVENTORY_ENV_EXAMPLE="$SCRIPT_DIR/inventory-service/env.example"
if [ ! -f "$INVENTORY_ENV" ]; then
  if [ -f "$INVENTORY_ENV_EXAMPLE" ]; then
    cp "$INVENTORY_ENV_EXAMPLE" "$INVENTORY_ENV"
    echo -e "${GREEN}✓ Created $INVENTORY_ENV${NC}"
  else
    echo -e "${RED}✗ env.example not found for inventory-service${NC}"
  fi
else
  echo -e "${YELLOW}✓ .env already exists for inventory-service (skipping)${NC}"
fi

# Delivery Service
DELIVERY_ENV="$SCRIPT_DIR/delivery-service/.env"
DELIVERY_ENV_EXAMPLE="$SCRIPT_DIR/delivery-service/env.example"
if [ ! -f "$DELIVERY_ENV" ]; then
  if [ -f "$DELIVERY_ENV_EXAMPLE" ]; then
    cp "$DELIVERY_ENV_EXAMPLE" "$DELIVERY_ENV"
    echo -e "${GREEN}✓ Created $DELIVERY_ENV${NC}"
  else
    echo -e "${RED}✗ env.example not found for delivery-service${NC}"
  fi
else
  echo -e "${YELLOW}✓ .env already exists for delivery-service (skipping)${NC}"
fi
echo ""

# 3. Install dependencies
echo -e "${YELLOW}3. Installing dependencies...${NC}"

# Sales System
echo -e "${YELLOW}Installing dependencies for sales-service...${NC}"
cd "$SCRIPT_DIR/sales-service"
if [ -f "package.json" ]; then
  npm install
  echo -e "${GREEN}✓ Dependencies installed for sales-service${NC}"
else
  echo -e "${RED}✗ package.json not found in sales-service${NC}"
fi
echo ""

# Inventory Service
echo -e "${YELLOW}Installing dependencies for inventory-service...${NC}"
cd "$SCRIPT_DIR/inventory-service"
if [ -f "package.json" ]; then
  npm install
  echo -e "${GREEN}✓ Dependencies installed for inventory-service${NC}"
else
  echo -e "${RED}✗ package.json not found in inventory-service${NC}"
fi
echo ""

# Delivery Service
echo -e "${YELLOW}Installing dependencies for delivery-service...${NC}"
cd "$SCRIPT_DIR/delivery-service"
if [ -f "package.json" ]; then
  npm install
  echo -e "${GREEN}✓ Dependencies installed for delivery-service${NC}"
else
  echo -e "${RED}✗ package.json not found in delivery-service${NC}"
fi
echo ""

# Return to script directory
cd "$SCRIPT_DIR"

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Review and update .env files if needed"
echo "  2. Make sure RabbitMQ is running (for message queue)"
echo "  3. Start services:"
echo "     - sales-service: npm run dev (in sales-service/)"
echo "     - inventory-service: npm run dev (in inventory-service/)"
echo "     - delivery-service: npm run dev (in delivery-service/)"
echo ""

