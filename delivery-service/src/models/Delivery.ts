// Event types for message queue
export interface OrderCreatedEvent {
  order_id: string;
  customer_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  total_amount: number;
  created_at: string;
}

export interface DeliveryStatusUpdateEvent {
  order_id: string;
  status: 'Shipped' | 'Delivered';
  updated_at: string;
}
