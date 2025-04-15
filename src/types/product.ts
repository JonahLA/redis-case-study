import { Prisma } from '@prisma/client';

/**
 * Response shape for detailed product information
 */
export interface ProductDetailResponse {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
  /** Product description */
  description: string;
  /** Product price as string (for precision) */
  price: string;
  /** Current stock level */
  stock: number;
  /** URL to product image */
  imageUrl: string | null;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Product category information */
  category: {
    id: number;
    name: string;
    description: string;
  };
  /** Product brand information */
  brand: {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
  };
  /** Related products from the same category */
  relatedProducts: {
    id: number;
    name: string;
    price: string;
    imageUrl: string | null;
  }[];
}

/**
 * Generic paginated response type for product listings
 */
export interface PaginatedResponse<T> {
  /** Array of items in the current page */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Total number of items across all pages */
    total: number;
    /** Number of items per page */
    limit: number;
    /** Number of items to skip */
    offset: number;
    /** Whether there are more items in subsequent pages */
    hasMore: boolean;
  };
}