// filepath: c:\Users\jonah\school\winter25\cs452\final-project\redis-case-study\tests\unit\services\inventoryService.test.ts
import { InventoryService } from '../../../src/services/inventoryService';
import { ProductRepository } from '../../../src/repositories/productRepository';
import { InventoryAuditRepository } from '../../../src/repositories/inventoryAuditRepository';
import { AppError } from '../../../src/middleware/errorMiddleware';

// Mock the repositories
jest.mock('../../../src/repositories/productRepository');
jest.mock('../../../src/repositories/inventoryAuditRepository');

describe('InventoryService', () => {
  // Mock instances
  let inventoryService: InventoryService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  let mockAuditRepository: jest.Mocked<InventoryAuditRepository>;
  let consoleSpy: jest.SpyInstance;
  
  // Test data
  const testProductId = 1;
  const mockProduct = {
    id: testProductId,
    name: 'Test Product',
    description: 'Test description',
    price: { toNumber: () => 19.99 } as any,
    imageUrl: 'test-url.jpg',
    stock: 10,
    categoryId: 1,
    brandId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockLowStockProduct = {
    ...mockProduct,
    stock: 3
  };
  
  const mockOutOfStockProduct = {
    ...mockProduct,
    stock: 0
  };
  
  const mockAuditEntry = {
    id: 1,
    productId: testProductId,
    previousStock: 10,
    newStock: 15,
    adjustment: 5,
    reason: 'Restocking',
    timestamp: new Date()
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Suppress console.error output
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set up the mocked repositories
    mockProductRepository = new ProductRepository() as jest.Mocked<ProductRepository>;
    mockAuditRepository = new InventoryAuditRepository() as jest.Mocked<InventoryAuditRepository>;
    
    // Create a new instance of InventoryService for each test
    inventoryService = new InventoryService();
    
    // Replace the internal repositories with our mocks
    (inventoryService as any).repository = mockProductRepository;
    (inventoryService as any).auditRepository = mockAuditRepository;
  });

  afterEach(() => {
    // Restore console.error
    consoleSpy.mockRestore();
  });

  describe('getInventory', () => {
    it('should return inventory status for a valid product ID', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      
      // Act
      const result = await inventoryService.getInventory(testProductId);
      
      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledWith(testProductId);
      expect(result).toEqual({
        productId: testProductId,
        currentStock: mockProduct.stock,
        status: 'in_stock',
        lastUpdated: mockProduct.updatedAt.toISOString()
      });
    });
    
    it('should return low_stock status when product stock is below threshold', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockLowStockProduct);
      
      // Act
      const result = await inventoryService.getInventory(testProductId);
      
      // Assert
      expect(result.status).toBe('low_stock');
    });
    
    it('should return out_of_stock status when product stock is zero', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockOutOfStockProduct);
      
      // Act
      const result = await inventoryService.getInventory(testProductId);
      
      // Assert
      expect(result.status).toBe('out_of_stock');
    });
    
    it('should throw an error when product is not found', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(inventoryService.getInventory(999))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });
    
    it('should handle repository errors', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(inventoryService.getInventory(testProductId))
        .rejects.toThrow(new AppError('Failed to fetch inventory information', 500));
    });
  });

  describe('adjustInventory', () => {
    it('should successfully adjust inventory and return updated status', async () => {
      // Arrange
      const adjustment = 5;
      const reason = 'Restocking';
      const previousStock = mockProduct.stock;
      const newStock = previousStock + adjustment;
      
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockProductRepository.adjustStock = jest.fn().mockResolvedValue({ ...mockProduct, stock: newStock });
      mockAuditRepository.createAuditEntry = jest.fn().mockResolvedValue(mockAuditEntry);
      
      // Mock Date.now to return consistent timestamp
      const mockDate = new Date('2025-04-10T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      // Act
      const result = await inventoryService.adjustInventory(testProductId, adjustment, reason);
      
      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledWith(testProductId);
      expect(mockProductRepository.adjustStock).toHaveBeenCalledWith(testProductId, adjustment);
      expect(mockAuditRepository.createAuditEntry).toHaveBeenCalledWith({
        productId: testProductId,
        previousStock,
        newStock,
        adjustment,
        reason
      });
      
      expect(result).toEqual({
        productId: testProductId,
        previousStock,
        currentStock: newStock,
        adjustment,
        status: 'in_stock',
        timestamp: mockDate.toISOString()
      });
      
      // Restore global Date
      jest.restoreAllMocks();
    });
    
    it('should adjust inventory without a reason', async () => {
      // Arrange
      const adjustment = 5;
      const previousStock = mockProduct.stock;
      const newStock = previousStock + adjustment;
      
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockProductRepository.adjustStock = jest.fn().mockResolvedValue({ ...mockProduct, stock: newStock });
      mockAuditRepository.createAuditEntry = jest.fn().mockResolvedValue(mockAuditEntry);
      
      // Act
      await inventoryService.adjustInventory(testProductId, adjustment);
      
      // Assert
      expect(mockAuditRepository.createAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: testProductId,
          previousStock,
          newStock,
          adjustment,
          reason: undefined
        })
      );
    });
    
    it('should return correct status when adjustment results in low stock', async () => {
      // Arrange
      const adjustment = -8; // Starting with 10, this will result in 2 (low_stock)
      const previousStock = mockProduct.stock;
      const newStock = previousStock + adjustment;
      
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockProductRepository.adjustStock = jest.fn().mockResolvedValue({ ...mockProduct, stock: newStock });
      mockAuditRepository.createAuditEntry = jest.fn().mockResolvedValue({
        ...mockAuditEntry,
        previousStock,
        newStock,
        adjustment
      });
      
      // Act
      const result = await inventoryService.adjustInventory(testProductId, adjustment);
      
      // Assert
      expect(result.status).toBe('low_stock');
    });
    
    it('should return correct status when adjustment results in out of stock', async () => {
      // Arrange
      const adjustment = -10; // Starting with 10, this will result in 0 (out_of_stock)
      const previousStock = mockProduct.stock;
      const newStock = previousStock + adjustment;
      
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockProductRepository.adjustStock = jest.fn().mockResolvedValue({ ...mockProduct, stock: newStock });
      mockAuditRepository.createAuditEntry = jest.fn().mockResolvedValue({
        ...mockAuditEntry,
        previousStock,
        newStock,
        adjustment
      });
      
      // Act
      const result = await inventoryService.adjustInventory(testProductId, adjustment);
      
      // Assert
      expect(result.status).toBe('out_of_stock');
    });
    
    it('should throw an error when product is not found', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(inventoryService.adjustInventory(999, 5))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });
    
    it('should throw an error when adjustment would result in negative stock', async () => {
      // Arrange
      const adjustment = -15; // Would result in -5 stock
      
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      
      // Act & Assert
      await expect(inventoryService.adjustInventory(testProductId, adjustment))
        .rejects.toThrow(
          new AppError(
            `Cannot adjust inventory to below zero. Current stock: ${mockProduct.stock}, Requested adjustment: ${adjustment}`,
            400
          )
        );
    });
    
    it('should handle repository errors', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(inventoryService.adjustInventory(testProductId, 5))
        .rejects.toThrow(new AppError('Failed to adjust inventory', 500));
    });
  });

  describe('getInventoryAuditHistory', () => {
    it('should return audit history for a valid product ID with default parameters', async () => {
      // Arrange
      const mockAuditEntries = [mockAuditEntry];
      
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockAuditRepository.getAuditHistoryByProduct = jest.fn().mockResolvedValue(mockAuditEntries);
      
      // Act
      const result = await inventoryService.getInventoryAuditHistory(testProductId);
      
      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledWith(testProductId);
      expect(mockAuditRepository.getAuditHistoryByProduct).toHaveBeenCalledWith(testProductId, 20, 0);
      expect(result).toEqual([
        {
          id: mockAuditEntry.id,
          productId: mockAuditEntry.productId,
          productName: mockProduct.name,
          previousStock: mockAuditEntry.previousStock,
          newStock: mockAuditEntry.newStock,
          adjustment: mockAuditEntry.adjustment,
          reason: mockAuditEntry.reason,
          timestamp: mockAuditEntry.timestamp.toISOString()
        }
      ]);
    });
    
    it('should return audit history with custom limit and offset', async () => {
      // Arrange
      const limit = 5;
      const offset = 10;
      const mockAuditEntries = [mockAuditEntry];
      
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockAuditRepository.getAuditHistoryByProduct = jest.fn().mockResolvedValue(mockAuditEntries);
      
      // Act
      await inventoryService.getInventoryAuditHistory(testProductId, limit, offset);
      
      // Assert
      expect(mockAuditRepository.getAuditHistoryByProduct).toHaveBeenCalledWith(testProductId, limit, offset);
    });
    
    it('should return empty array when no audit entries exist', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockAuditRepository.getAuditHistoryByProduct = jest.fn().mockResolvedValue([]);
      
      // Act
      const result = await inventoryService.getInventoryAuditHistory(testProductId);
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should handle entries with no reason specified', async () => {
      // Arrange
      const mockEntryWithoutReason = {
        ...mockAuditEntry,
        reason: null
      };
      
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockAuditRepository.getAuditHistoryByProduct = jest.fn().mockResolvedValue([mockEntryWithoutReason]);
      
      // Act
      const result = await inventoryService.getInventoryAuditHistory(testProductId);
      
      // Assert
      expect(result[0].reason).toBe('Not specified');
    });
    
    it('should throw an error when product is not found', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(inventoryService.getInventoryAuditHistory(999))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });
    
    it('should handle repository errors', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(inventoryService.getInventoryAuditHistory(testProductId))
        .rejects.toThrow(new AppError('Failed to fetch inventory audit history', 500));
    });
  });

  describe('adjustInventoryBatch', () => {
    it('should adjust inventory for multiple products in a batch', async () => {
      // Arrange
      const mockProduct1 = { ...mockProduct, id: 1, stock: 10 };
      const mockProduct2 = { ...mockProduct, id: 2, stock: 20, name: 'Test Product 2' };
      
      const batchItems = [
        { productId: 1, quantity: 2, reason: 'Order #123' },
        { productId: 2, quantity: 3, reason: 'Order #123' }
      ];
      
      mockProductRepository.findByIds = jest.fn().mockResolvedValue([mockProduct1, mockProduct2]);
      mockProductRepository.batchAdjustStock = jest.fn().mockResolvedValue([
        { ...mockProduct1, stock: 8 },
        { ...mockProduct2, stock: 17 }
      ]);
      mockAuditRepository.createAuditEntry = jest.fn().mockResolvedValue(mockAuditEntry);
      
      // Mock Date.now to return consistent timestamp
      const mockDate = new Date('2025-04-10T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      
      // Act
      const result = await inventoryService.adjustInventoryBatch(batchItems);
      
      // Assert
      expect(mockProductRepository.findByIds).toHaveBeenCalledWith([1, 2]);
      expect(mockProductRepository.batchAdjustStock).toHaveBeenCalledWith([
        { id: 1, adjustment: -2 },
        { id: 2, adjustment: -3 }
      ]);
      
      expect(mockAuditRepository.createAuditEntry).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          productId: 1,
          previousStock: 10,
          currentStock: 8,
          adjustment: -2,
          status: 'in_stock',
          timestamp: mockDate.toISOString()
        },
        {
          productId: 2,
          previousStock: 20,
          currentStock: 17,
          adjustment: -3,
          status: 'in_stock',
          timestamp: mockDate.toISOString()
        }
      ]);
      
      // Restore global Date
      jest.restoreAllMocks();
    });
    
    it('should handle items without a reason', async () => {
      // Arrange
      const mockProduct1 = { ...mockProduct, id: 1, stock: 10 };
      
      const batchItems = [
        { productId: 1, quantity: 2 }
      ];
      
      mockProductRepository.findByIds = jest.fn().mockResolvedValue([mockProduct1]);
      mockProductRepository.batchAdjustStock = jest.fn().mockResolvedValue([
        { ...mockProduct1, stock: 8 }
      ]);
      mockAuditRepository.createAuditEntry = jest.fn().mockResolvedValue(mockAuditEntry);
      
      // Act
      await inventoryService.adjustInventoryBatch(batchItems);
      
      // Assert
      expect(mockAuditRepository.createAuditEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Batch adjustment'
        })
      );
    });
    
    it('should throw an error when a product is not found', async () => {
      // Arrange
      const mockProduct1 = { ...mockProduct, id: 1, stock: 10 };
      
      const batchItems = [
        { productId: 1, quantity: 2 },
        { productId: 999, quantity: 3 }
      ];
      
      mockProductRepository.findByIds = jest.fn().mockResolvedValue([mockProduct1]);
      
      // Act & Assert
      await expect(inventoryService.adjustInventoryBatch(batchItems))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });
    
    it('should throw an error when adjustment would result in negative stock', async () => {
      // Arrange
      const mockProduct1 = { ...mockProduct, id: 1, stock: 10 };
      
      const batchItems = [
        { productId: 1, quantity: 15 } // Would result in -5 stock
      ];
      
      mockProductRepository.findByIds = jest.fn().mockResolvedValue([mockProduct1]);
      
      // Act & Assert
      await expect(inventoryService.adjustInventoryBatch(batchItems))
        .rejects.toThrow(
          new AppError(
            `Insufficient stock for product Test Product (ID: 1). Current: 10, Requested: 15`,
            400
          )
        );
    });
    
    it('should handle empty batch', async () => {
      // Arrange
      const batchItems: Array<{ productId: number; quantity: number }> = [];
      
      // Act
      const result = await inventoryService.adjustInventoryBatch(batchItems);
      
      // Assert
      expect(result).toEqual([]);
      expect(mockProductRepository.findByIds).toHaveBeenCalledWith([]);
    });
    
    it('should handle repository errors', async () => {
      // Arrange
      const batchItems = [
        { productId: 1, quantity: 2 }
      ];
      
      mockProductRepository.findByIds = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(inventoryService.adjustInventoryBatch(batchItems))
        .rejects.toThrow(new AppError('Failed to update inventory for all products', 500));
    });
  });
});