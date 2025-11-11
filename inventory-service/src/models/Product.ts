export interface Product {
  id: string;
  name: string;
  stock_quantity: number;
}

export interface AvailabilityCheckItem {
  product_id: string;
  quantity: number;
}

export interface AvailabilityCheckResult {
  available: boolean;
  unavailable_items?: Array<{
    product_id: string;
    requested_quantity: number;
    available_quantity: number;
  }>;
}
