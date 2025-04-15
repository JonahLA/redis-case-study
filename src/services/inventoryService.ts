import { ProductRepository } from '../repositories/productRepository';
import { InventoryAuditRepository } from '../repositories/inventoryAuditRepository';
import { AppError } from '../middleware/errorMiddleware';
import { InventoryStatus, InventoryAdjustmentResponse, InventoryAuditResponse } from '../types/inventory';

export class InventoryService {
  private readonly LOW_STOCK_THRESHOLD = 5;
  private productRepository: ProductRepository;
  private inventoryAuditRepository: InventoryAuditRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.inventoryAuditRepository = new InventoryAuditRepository();
  }

  /**
   * Get current inventory status for a product
   */
  async getInventoryStatus(productId: number): Promise<InventoryStatus> {
    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }

      return {
        productId,
        currentStock: product.stock,
        status: this.determineStockStatus(product.stock),
        lastUpdated: product.updatedAt.toISOString()
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get inventory status', 500);
    }
  }

  /**
   * Increment inventory for a product
   */
  async incrementStock(productId: number, quantity: number): Promise<InventoryAdjustmentResponse> {
    if (quantity <= 0) {
      throw new AppError('Quantity must be positive for increment operation', 400);
    }

    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }

      const newStock = product.stock + quantity;
      await this.productRepository.update(productId, { stock: newStock });

      // Record the adjustment
      await this.inventoryAuditRepository.create({
        productId,
        quantity,
        reason: 'Stock increment',
        source: 'system'
      });

      return {
        productId,
        adjustedQuantity: quantity,
        newStockLevel: newStock,
        status: this.determineStockStatus(newStock),
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to increment stock', 500);
    }
  }

  /**
   * Decrement inventory for a product
   */
  async decrementStock(productId: number, quantity: number): Promise<InventoryAdjustmentResponse> {
    if (quantity <= 0) {
      throw new AppError('Quantity must be positive for decrement operation', 400);
    }

    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }

      if (product.stock < quantity) {
        throw new AppError(`Insufficient stock for product ${product.name}. Available: ${product.stock}`, 400);
      }

      const newStock = product.stock - quantity;
      await this.productRepository.update(productId, { stock: newStock });

      // Record the adjustment
      await this.inventoryAuditRepository.create({
        productId,
        quantity: -quantity,
        reason: 'Stock decrement',
        source: 'system'
      });

      return {
        productId,
        adjustedQuantity: -quantity,
        newStockLevel: newStock,
        status: this.determineStockStatus(newStock),
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to decrement stock', 500);
    }
  }

  /**
   * Adjust inventory for multiple products in a batch
   */
  async batchAdjustStock(items: Array<{ productId: number; quantity: number; reason?: string }>): Promise<InventoryAdjustmentResponse[]> {
    try {
      // Handle empty batch case
      if (items.length === 0) {
        return [];
      }

      // First validate all products exist and have sufficient stock
      const productIds = items.map(item => item.productId);
      const products = await this.productRepository.findByIds(productIds);

      if (products.length !== productIds.length) {
        const foundIds = products.map(p => p.id);
        const missingIds = productIds.filter(id => !foundIds.includes(id));
        throw new AppError(`Products not found: ${missingIds.join(', ')}`, 404);
      }

      // Check stock levels for decrements
      const decrements = items.filter(item => item.quantity < 0);
      for (const item of decrements) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue; // Already checked existence above

        if (product.stock < Math.abs(item.quantity)) {
          throw new AppError(
            `Insufficient stock for product ${product.name}. Required: ${Math.abs(item.quantity)}, Available: ${product.stock}`,
            400
          );
        }
      }

      // Process all adjustments
      const adjustments = await Promise.all(
        items.map(async item => {
          const product = products.find(p => p.id === item.productId)!;
          const previousStock = product.stock;
          const newStock = previousStock + item.quantity;

          await this.productRepository.update(item.productId, { stock: newStock });

          // Record the adjustment
          await this.inventoryAuditRepository.create({
            productId: item.productId,
            quantity: item.quantity,
            reason: item.reason || (item.quantity > 0 ? 'Batch stock increment' : 'Batch stock decrement'),
            source: 'system'
          });

          return {
            productId: item.productId,
            adjustedQuantity: item.quantity,
            newStockLevel: newStock,
            status: this.determineStockStatus(newStock),
            timestamp: new Date().toISOString()
          };
        })
      );

      return adjustments;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to process batch stock adjustment', 500);
    }
  }

  /**
   * Get audit history for a product
   */
  async getInventoryAuditHistory(productId: number): Promise<InventoryAuditResponse[]> {
    try {
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }

      const auditRecords = await this.inventoryAuditRepository.getAuditHistoryByProduct(productId);
      return auditRecords.map(record => ({
        productId: record.productId,
        quantity: record.adjustment,
        reason: record.reason || 'Not specified',
        source: 'system',
        timestamp: record.timestamp.toISOString()
      }));
    } catch (error: any) {
      if (error instanceof AppError) throw error;
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
}
