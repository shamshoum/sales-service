#!/bin/bash

# Get order ID from argument or use default
ORDER_ID="${1}"

if [ -z "$ORDER_ID" ]; then
  echo "Usage: $0 <ORDER_ID>"
  echo ""
  echo "First, create an order to get an order ID:"
  echo "  ORDER_RESPONSE=\$(curl -s -X POST http://localhost:3000/api/orders \\"
  echo "    -H \"Content-Type: application/json\" \\"
  echo "    -d '{\"customer_id\": \"customer-123\", \"items\": [{\"product_id\": \"product-1\", \"quantity\": 2}]}')"
  echo "  ORDER_ID=\$(echo \$ORDER_RESPONSE | grep -o '\"order_id\":\"[^\"]*\"' | cut -d'\"' -f4)"
  echo ""
  exit 1
fi

DELIVERY_URL="http://localhost:3002"

echo "=== Testing Delivery Service Status Update ==="
echo "Order ID: $ORDER_ID"
echo ""

# Health check
echo "1. Health Check:"
curl -s $DELIVERY_URL/health
echo ""
echo ""

# Update to Shipped
echo "2. Update Status to 'Shipped':"
curl -X POST $DELIVERY_URL/api/delivery/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Shipped"}'
echo ""
echo ""

# Update to Delivered
echo "3. Update Status to 'Delivered':"
curl -X POST $DELIVERY_URL/api/delivery/$ORDER_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "Delivered"}'
echo ""
echo ""

echo "=== Test Complete ==="
echo ""
echo "To verify the order was updated in the sales system, run:"
echo "  curl http://localhost:3000/api/orders/$ORDER_ID"
