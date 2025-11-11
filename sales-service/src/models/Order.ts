export enum OrderStatus {
  PENDING_SHIPMENT = 'Pending Shipment',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered'
}

export interface OrderItem {
  product_id: string;
  quantity: number;
}

export interface Order {
  id: string;
  customer_id: string;
  status: OrderStatus;
  items: OrderItem[];
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: number;
  order_id: string;
  status: OrderStatus;
  changed_at: string;
}

