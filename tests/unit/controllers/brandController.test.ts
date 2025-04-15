import { Request, Response } from 'express';
import { BrandService } from '../../../src/services/brandService';
import brandController from '../../../src/controllers/brandController';
import { createMockRequest, createMockResponse, createMockNext } from '../../utils/mockUtils';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the BrandService
jest.mock('../../../src/services/brandService', () => {
  const mockGetAllBrands = jest.fn();
  const mockGetBrandById = jest.fn();
  const mockGetProductsByBrand = jest.fn();
  
  return {
    BrandService: jest.fn().mockImplementation(() => ({
      getAllBrands: mockGetAllBrands,
      getBrandById: mockGetBrandById,
      getProductsByBrand: mockGetProductsByBrand
    })),
    mockGetAllBrands,
    mockGetBrandById,
    mockGetProductsByBrand
  };
});

// Import the mock functions after mocking
const {
  mockGetAllBrands,
  mockGetBrandById,
  mockGetProductsByBrand
} = jest.requireMock('../../../src/services/brandService');

describe('Brand Controller', () => {
  const mockBrands = [
    {
      id: 1,
      name: 'Test Brand 1',
      description: 'Description for Brand 1',
      imageUrl: 'brand1.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Test Brand 2',
      description: 'Description for Brand 2',
      imageUrl: 'brand2.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockProducts = [
    {
      id: 1,
      name: 'Test Product 1',
      description: 'Description for Product 1',
      price: new Prisma.Decimal(19.99),
      imageUrl: 'image1.jpg',
      stock: 10,
      categoryId: 1,
      brandId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all brands with 200 OK', async () => {
      // Arrange
      mockGetAllBrands.mockResolvedValue(mockBrands);
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetAllBrands).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ brands: mockBrands });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockGetAllBrands.mockRejectedValue(new Error('Database error'));
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('GET /:brandId', () => {
    it('should return brand by ID with 200 OK', async () => {
      // Arrange
      mockGetBrandById.mockResolvedValue(mockBrands[0]);
      
      const req = createMockRequest({
        params: { brandId: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetBrandById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ brand: mockBrands[0] });
    });

    it('should handle invalid brand ID format', async () => {
      // Arrange
      const req = createMockRequest({
        params: { brandId: 'invalid' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetBrandById).not.toHaveBeenCalled();
    });

    it('should handle brand not found', async () => {
      // Arrange
      mockGetBrandById.mockRejectedValue(new AppError('Brand with ID 999 not found', 404));
      
      const req = createMockRequest({
        params: { brandId: '999' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetBrandById).toHaveBeenCalledWith(999);
    });
  });

  describe('GET /:brandId/products', () => {
    it('should return products with default pagination', async () => {
      // Arrange
      const paginatedResponse = {
        data: mockProducts,
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false
        }
      };
      mockGetProductsByBrand.mockResolvedValue(paginatedResponse);
      
      const req = createMockRequest({
        params: { brandId: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetProductsByBrand).toHaveBeenCalledWith(1, {
        limit: undefined,
        offset: undefined,
        sort: undefined,
        order: 'asc'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        products: mockProducts,
        pagination: paginatedResponse.pagination
      });
    });

    it('should handle pagination and sorting parameters', async () => {
      // Arrange
      const paginatedResponse = {
        data: mockProducts,
        pagination: {
          total: 1,
          limit: 5,
          offset: 10,
          hasMore: false
        }
      };
      mockGetProductsByBrand.mockResolvedValue(paginatedResponse);
      
      const req = createMockRequest({
        params: { brandId: '1' },
        query: {
          limit: '5',
          offset: '10',
          sort: 'price',
          order: 'desc'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetProductsByBrand).toHaveBeenCalledWith(1, {
        limit: 5,
        offset: 10,
        sort: 'price',
        order: 'desc'
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid pagination parameters', async () => {
      // Arrange
      const req = createMockRequest({
        params: { brandId: '1' },
        query: {
          limit: '-5',
          offset: 'invalid'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetProductsByBrand).not.toHaveBeenCalled();
    });

    it('should handle invalid sort parameter', async () => {
      // Arrange
      const req = createMockRequest({
        params: { brandId: '1' },
        query: {
          sort: 'invalid'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetProductsByBrand).not.toHaveBeenCalled();
    });

    it('should handle invalid order parameter', async () => {
      // Arrange
      const req = createMockRequest({
        params: { brandId: '1' },
        query: {
          order: 'invalid'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = brandController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetProductsByBrand).not.toHaveBeenCalled();
    });
  });
});