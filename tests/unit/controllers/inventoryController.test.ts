import { Request, Response } from 'express';
import { InventoryService } from '../../../src/services/inventoryService';
import inventoryController from '../../../src/controllers/inventoryController';
import { createMockRequest, createMockResponse, createMockNext } from '../../utils/mockUtils';
import { AppError } from '../../../src/middleware/errorMiddleware';

// Mock the InventoryService
jest.mock('../../../src/services/inventoryService', () => {
  const mockBatchAdjustStock = jest.fn();
  const mockGetInventoryStatus = jest.fn();
  const mockGetInventoryAuditHistory = jest.fn();
  
  return {
    InventoryService: jest.fn().mockImplementation(() => ({
      batchAdjustStock: mockBatchAdjustStock,
      getInventoryStatus: mockGetInventoryStatus,
      getInventoryAuditHistory: mockGetInventoryAuditHistory
    })),
    mockBatchAdjustStock,
    mockGetInventoryStatus,
    mockGetInventoryAuditHistory
  };
});

// Import the mock functions after mocking
const {
  mockBatchAdjustStock,
  mockGetInventoryStatus,
  mockGetInventoryAuditHistory
} = jest.requireMock('../../../src/services/inventoryService');

describe('Inventory Controller', () => {
  const mockProductId = 1;

  const mockInventoryStatus = {
    productId: mockProductId,
    currentStock: 10,
    status: 'in_stock' as const,
    lastUpdated: new Date().toISOString()
  };

  const mockAdjustmentResponse = {
    productId: mockProductId,
    previousStock: 10,
    currentStock: 12,
    adjustment: 2,
    status: 'in_stock' as const,
    timestamp: new Date().toISOString()
  };

  const mockAuditHistory = [
    {
      id: 1,
      productId: mockProductId,
      productName: 'Test Product',
      previousStock: 8,
      newStock: 10,
      adjustment: 2,
      reason: 'Stock replenishment',
      timestamp: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /:productId/adjust', () => {
    it('should adjust inventory and return updated status', async () => {
      // Arrange
      mockBatchAdjustStock.mockResolvedValue([mockAdjustmentResponse]);
      
      const req = createMockRequest({
        params: { productId: mockProductId.toString() },
        body: {
          adjustment: 2,
          reason: 'Stock replenishment'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockBatchAdjustStock).toHaveBeenCalledWith([{
        productId: mockProductId,
        quantity: 2,
        reason: 'Stock replenishment'
      }]);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockAdjustmentResponse);
    });

    it('should handle invalid product ID', async () => {
      // Arrange
      const req = createMockRequest({
        params: { productId: 'invalid' },
        body: {
          adjustment: 2,
          reason: 'Stock replenishment'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockBatchAdjustStock).not.toHaveBeenCalled();
    });

    it('should handle invalid adjustment value', async () => {
      // Arrange
      const req = createMockRequest({
        params: { productId: mockProductId.toString() },
        body: {
          reason: 'Stock replenishment'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockBatchAdjustStock).not.toHaveBeenCalled();
    });
  });

  describe('GET /:productId', () => {
    it('should return inventory status with 200 OK', async () => {
      // Arrange
      mockGetInventoryStatus.mockResolvedValue(mockInventoryStatus);
      
      const req = createMockRequest({
        params: { productId: mockProductId.toString() }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetInventoryStatus).toHaveBeenCalledWith(mockProductId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockInventoryStatus);
    });

    it('should handle invalid product ID', async () => {
      // Arrange
      const req = createMockRequest({
        params: { productId: 'invalid' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetInventoryStatus).not.toHaveBeenCalled();
    });

    it('should handle product not found', async () => {
      // Arrange
      mockGetInventoryStatus.mockRejectedValue(new AppError('Product not found', 404));
      
      const req = createMockRequest({
        params: { productId: '999' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('GET /:productId/audit', () => {
    it('should return audit history with default pagination', async () => {
      // Arrange
      mockGetInventoryAuditHistory.mockResolvedValue(mockAuditHistory);
      
      const req = createMockRequest({
        params: { productId: mockProductId.toString() }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetInventoryAuditHistory).toHaveBeenCalledWith(mockProductId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ auditHistory: mockAuditHistory });
    });

    it('should handle custom pagination parameters', async () => {
      // Arrange
      mockGetInventoryAuditHistory.mockResolvedValue(mockAuditHistory);
      
      const req = createMockRequest({
        params: { productId: mockProductId.toString() },
        query: {
          limit: '5',
          offset: '10'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetInventoryAuditHistory).toHaveBeenCalledWith(mockProductId);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid product ID', async () => {
      // Arrange
      const req = createMockRequest({
        params: { productId: 'invalid' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetInventoryAuditHistory).not.toHaveBeenCalled();
    });

    it('should handle invalid pagination parameters', async () => {
      // Arrange
      const req = createMockRequest({
        params: { productId: mockProductId.toString() },
        query: {
          limit: '-5',
          offset: 'invalid'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = inventoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetInventoryAuditHistory).not.toHaveBeenCalled();
    });
  });
});