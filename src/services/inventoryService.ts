import { ProductRepository } from '../repositories/productRepository';
import { InventoryAuditRepository } from '../repositories/inventoryAuditRepository';
import { AppError } from '../middleware/errorMiddleware';

// Define interfaces for the service responses
interface InventoryStatus {
  productId: number;
  currentStock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

interface InventoryAdjustmentResponse {
  productId: number;
  previousStock: number;
  currentStock: number;
  adjustment: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  timestamp: string;
}

interface InventoryAuditResponse {
  id: number;
  productId: number;
  productName?: string;
  previousStock: number;
  newStock: number;
  adjustment: number;
  reason: string;
  timestamp: string;
}

export class InventoryService {
  private repository: ProductRepository;
  private auditRepository: InventoryAuditRepository;
  private LOW_STOCK_THRESHOLD = 5; // Define threshold for low stock alert
  
  constructor() {
    this.repository = new ProductRepository();
    this.auditRepository = new InventoryAuditRepository();
  }

  /**
   * Get current inventory for a product
   */
  async getInventory(productId: number): Promise<InventoryStatus> {
    try {
      const product = await this.repository.findById(productId);
      
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }
      
      return {
        productId: product.id,
        currentStock: product.stock,
        status: this.determineStockStatus(product.stock),
        lastUpdated: product.updatedAt.toISOString()
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`Error fetching inventory for product ${productId}:`, error);
      throw new AppError('Failed to fetch inventory information', 500);
    }
  }

  /**
   * Adjust inventory levels for a product
   */
  async adjustInventory(
    productId: number, 
    adjustment: number, 
    reason?: string
  ): Promise<InventoryAdjustmentResponse> {
    try {
      // Get current product information
      const product = await this.repository.findById(productId);
      
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }
      
      const previousStock = product.stock;
      const newStock = previousStock + adjustment;
      
      // Prevent negative inventory
      if (newStock < 0) {
        throw new AppError(
          `Cannot adjust inventory to below zero. Current stock: ${previousStock}, Requested adjustment: ${adjustment}`,
          400
        );
      }
      
      // Update the stock in the database
      await this.repository.adjustStock(productId, adjustment);
      
      // Record the adjustment in the audit log
      await this.auditRepository.createAuditEntry({
        productId,
        previousStock,
        newStock,
        adjustment,
        reason
      });
      
      // Determine the new stock status
      const status = this.determineStockStatus(newStock);
      
      // Return the response
      return {
        productId,
        previousStock,
        currentStock: newStock,
        adjustment,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`Error adjusting inventory for product ${productId}:`, error);
      throw new AppError('Failed to adjust inventory', 500);
    }
  }

  /**
   * Get audit history for a product
   */
  async getInventoryAuditHistory(
    productId: number,
    limit: number = 20,
    offset: number = 0
  ): Promise<InventoryAuditResponse[]> {
    try {
      // Verify the product exists
      const product = await this.repository.findById(productId);
      
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }
      
      const auditEntries = await this.auditRepository.getAuditHistoryByProduct(productId, limit, offset);
      
      return auditEntries.map(entry => ({
        id: entry.id,
        productId: entry.productId,
        productName: product.name,
        previousStock: entry.previousStock,
        newStock: entry.newStock,
        adjustment: entry.adjustment,
        reason: entry.reason || 'Not specified',
        timestamp: entry.timestamp.toISOString()
      }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`Error fetching audit history for product ${productId}:`, error);
      throw new AppError('Failed to fetch inventory audit history', 500);
    }
  }

  /**
   * Determine the stock status based on the current stock level
   */
  private determineStockStatus(stock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (stock <= 0) {
      return 'out_of_stock';
    } else if (stock <= this.LOW_STOCK_THRESHOLD) {
      return 'low_stock';
    } else {
      return 'in_stock';
    }
  }

  /**
   * Process inventory updates for multiple products in a single transaction
   * This method would be used when processing orders with multiple items
   */
  async adjustInventoryBatch(
    items: Array<{ productId: number; quantity: number; reason?: string }>
  ): Promise<Array<InventoryAdjustmentResponse>> {
    try {
      const productIds = items.map(item => item.productId);
      const products = await this.repository.findByIds(productIds);

      // Handle empty batch case after repository call
      if (items.length === 0) {
        return [];
      }
      
      // Create a map for easy lookup
      const productMap = new Map(products.map(p => [p.id, p]));
      
      // Prepare items for batch adjustment
      const adjustments = items.map(item => {
        const product = productMap.get(item.productId);
        
        if (!product) {
          throw new AppError(`Product with ID ${item.productId} not found`, 404);
        }
        
        const newStock = product.stock - item.quantity;
        if (newStock < 0) {
          throw new AppError(
            `Insufficient stock for product ${product.name} (ID: ${item.productId}). Current: ${product.stock}, Requested: ${item.quantity}`,
            400
          );
        }
        
        return {
          id: item.productId,
          adjustment: -item.quantity
        };
      });
      
      // Perform the batch update in a transaction
      await this.repository.batchAdjustStock(adjustments);
      
      // Create audit entries for each adjustment
      const auditPromises = items.map(item => {
        const product = productMap.get(item.productId)!;
        const previousStock = product.stock;
        const newStock = previousStock - item.quantity;
        
        return this.auditRepository.createAuditEntry({
          productId: item.productId,
          previousStock,
          newStock,
          adjustment: -item.quantity,
          reason: item.reason || 'Batch adjustment'
        });
      });
      
      // Wait for all audit entries to be created
      await Promise.all(auditPromises);
      
      // Prepare the response
      return items.map(item => {
        const product = productMap.get(item.productId)!;
        const previousStock = product.stock;
        const newStock = previousStock - item.quantity;
        
        return {
          productId: item.productId,
          previousStock,
          currentStock: newStock,
          adjustment: -item.quantity,
          status: this.determineStockStatus(newStock),
          timestamp: new Date().toISOString()
        };
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error processing batch inventory update:', error);
      throw new AppError('Failed to update inventory for all products', 500);
    }
  }
}
