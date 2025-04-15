/**
 * Current inventory status for a product
 */
export interface InventoryStatus {
  /** Product ID */
  productId: number;
  /** Current stock level */
  currentStock: number;
  /** Stock status (in_stock, low_stock, out_of_stock) */
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  /** Last inventory update timestamp */
  lastUpdated: string;
}

/**
 * Response for inventory adjustment operations
 */
export interface InventoryAdjustmentResponse {
  /** Product ID */
  productId: number;
  /** Quantity adjusted (positive for additions, negative for reductions) */
  adjustedQuantity: number;
  /** New stock level after adjustment */
  newStockLevel: number;
  /** Stock status after adjustment */
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  /** Timestamp of adjustment */
  timestamp: string;
}

/**
 * Audit record for inventory changes
 */
export interface InventoryAuditResponse {
  /** Product ID */
  productId: number;
  /** Quantity changed */
  quantity: number;
  /** Reason for the inventory change */
  reason: string;
  /** User or system that made the change */
  source: string;
  /** Timestamp of the change */
  timestamp: string;
}

/**
 * Request for inventory adjustment operations
 */
export interface InventoryAdjustmentRequest {
  productId: number;
  quantity: number;
  reason?: string;
}