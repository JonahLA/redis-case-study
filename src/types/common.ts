/**
 * Standard error response
 */
export interface ErrorResponse {
  /** HTTP status code */
  status: number;
  /** Error message */
  message: string;
  /** Optional additional error details */
  details?: unknown;
}

/**
 * Generic paginated response structure
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

/**
 * Generic sort options
 */
export interface SortOptions {
  /** Field to sort by */
  sort?: string;
  /** Sort direction */
  order?: 'asc' | 'desc';
}

/**
 * Generic pagination options
 */
export interface PaginationOptions {
  /** Number of items per page */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
}