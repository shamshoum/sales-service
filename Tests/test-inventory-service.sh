#!/bin/bash

TOKEN="inventory-service-secret-token-12345"
BASE_URL="http://localhost:3001"

echo "=== Testing Inventory Service ==="
echo ""

# Health check
echo "1. Health Check:"
curl -s $BASE_URL/health
echo ""
echo ""

# Get all products
echo "2. Get All Products:"
curl -s -H "token: $TOKEN" $BASE_URL/api/inventory/products | head -20
echo ""
echo ""

# Check availability - available
echo "3. Check Availability (Available):"
curl -s -X POST $BASE_URL/api/inventory/check \
  -H "Content-Type: application/json" \
  -H "token: $TOKEN" \
  -d '{
    "items": [
      {"product_id": "product-1", "quantity": 2},
      {"product_id": "product-2", "quantity": 5}
    ]
  }'
echo ""
echo ""

# Check availability - unavailable
echo "4. Check Availability (Unavailable):"
curl -s -X POST $BASE_URL/api/inventory/check \
  -H "Content-Type: application/json" \
  -H "token: $TOKEN" \
  -d '{
    "items": [
      {"product_id": "out-of-stock-product", "quantity": 1}
    ]
  }'
echo ""
echo ""

# Get single product
echo "5. Get Single Product:"
curl -s -H "token: $TOKEN" $BASE_URL/api/inventory/products/product-1
echo ""
echo ""

echo "=== Test Complete ==="
