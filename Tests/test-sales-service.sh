#!/bin/bash

echo "=== Testing Sales Service ==="
echo ""

# Health check
echo "1. Health Check:"
curl -s http://localhost:3000/health
echo ""
echo ""

# Create order
echo "2. Creating Order:"
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-123",
    "items": [
      {
        "product_id": "product-1",
        "quantity": 2
      }
    ]
  }')

echo "$ORDER_RESPONSE"
echo ""

ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"order_id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$ORDER_ID" ]; then
  echo "Order ID: $ORDER_ID"
  echo ""
  
  # Get order
  echo "3. Getting Order:"
  curl -s http://localhost:3000/api/orders/$ORDER_ID
  echo ""
  echo ""
  
  echo "=== Test Complete ==="
else
  echo "Failed to create order. Check the response above."
fi
