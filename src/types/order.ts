export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentDetails {
  method: string;
  simulatePayment: boolean;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  orderId: string;
  userId: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
}