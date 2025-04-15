/**
 * Request types for cart operations
 */
export interface AddToCartRequest {
  /** ID of the product to add */
  productId: number;
  /** Quantity to add */
  quantity: number;
}

export interface UpdateCartItemRequest {
  /** New quantity for the item */
  quantity: number;
}

/**
 * Request types for order operations
 */
export interface CreateOrderRequest {
  /** Shipping address information */
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  /** Payment details */
  paymentDetails: {
    method: 'credit_card' | 'debit_card' | 'paypal';
    status: 'success';
  };
}

/**
 * Request types for inventory operations
 */
export interface AdjustInventoryRequest {
  /** Product ID */
  productId: number;
  /** Quantity to adjust (positive for additions, negative for reductions) */
  quantity: number;
  /** Reason for adjustment */
  reason: string;
}

/**
 * Common query parameter types
 */
export interface PaginationQuery {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}