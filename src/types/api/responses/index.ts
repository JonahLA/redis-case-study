import { Cart } from '../../cart';
import { ProductDetailResponse } from '../../product';
import { InventoryStatus, InventoryAdjustmentResponse } from '../../inventory';
import { PaginatedResponse } from '../../common';

/**
 * Response types for cart operations
 */
export type CartResponse = Cart;

/**
 * Response types for product operations
 */
export interface ProductListResponse extends PaginatedResponse<ProductDetailResponse> {}

/**
 * Response types for category operations
 */
export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  categories: CategoryResponse[];
}

export interface CategoryProductsResponse extends PaginatedResponse<ProductDetailResponse> {}

/**
 * Response types for brand operations
 */
export interface BrandResponse {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandListResponse {
  brands: BrandResponse[];
}

export interface BrandProductsResponse extends PaginatedResponse<ProductDetailResponse> {}

/**
 * Response types for order operations
 */
export interface OrderResponse {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: OrderResponse[];
}

/**
 * Response types for inventory operations
 */
export type InventoryStatusResponse = InventoryStatus;
export type InventoryUpdateResponse = InventoryAdjustmentResponse;

/**
 * Generic success response
 */
export interface SuccessResponse {
  success: true;
  message: string;
}