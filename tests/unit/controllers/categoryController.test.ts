import { Request, Response } from 'express';
import { CategoryService } from '../../../src/services/categoryService';
import categoryController from '../../../src/controllers/categoryController';
import { createMockRequest, createMockResponse, createMockNext } from '../../utils/mockUtils';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the CategoryService
jest.mock('../../../src/services/categoryService', () => {
  const mockGetAllCategories = jest.fn();
  const mockGetCategoryById = jest.fn();
  const mockGetProductsByCategory = jest.fn();
  
  return {
    CategoryService: jest.fn().mockImplementation(() => ({
      getAllCategories: mockGetAllCategories,
      getCategoryById: mockGetCategoryById,
      getProductsByCategory: mockGetProductsByCategory
    })),
    mockGetAllCategories,
    mockGetCategoryById,
    mockGetProductsByCategory
  };
});

// Import the mock functions after mocking
const {
  mockGetAllCategories,
  mockGetCategoryById,
  mockGetProductsByCategory
} = jest.requireMock('../../../src/services/categoryService');

describe('Category Controller', () => {
  const mockCategories = [
    {
      id: 1,
      name: 'Test Category 1',
      description: 'Description for Category 1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Test Category 2',
      description: 'Description for Category 2',
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
    it('should return all categories with 200 OK', async () => {
      // Arrange
      mockGetAllCategories.mockResolvedValue(mockCategories);
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetAllCategories).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ categories: mockCategories });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockGetAllCategories.mockRejectedValue(new Error('Database error'));
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[0]?.route?.stack?.[0]?.handle;
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

  describe('GET /:categoryId', () => {
    it('should return category by ID with 200 OK', async () => {
      // Arrange
      mockGetCategoryById.mockResolvedValue(mockCategories[0]);
      
      const req = createMockRequest({
        params: { categoryId: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetCategoryById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ category: mockCategories[0] });
    });

    it('should handle invalid category ID format', async () => {
      // Arrange
      const req = createMockRequest({
        params: { categoryId: 'invalid' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetCategoryById).not.toHaveBeenCalled();
    });

    it('should handle category not found', async () => {
      // Arrange
      mockGetCategoryById.mockRejectedValue(new AppError('Category with ID 999 not found', 404));
      
      const req = createMockRequest({
        params: { categoryId: '999' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetCategoryById).toHaveBeenCalledWith(999);
    });
  });

  describe('GET /:categoryId/products', () => {
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
      mockGetProductsByCategory.mockResolvedValue(paginatedResponse);
      
      const req = createMockRequest({
        params: { categoryId: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetProductsByCategory).toHaveBeenCalledWith(1, {
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
      mockGetProductsByCategory.mockResolvedValue(paginatedResponse);
      
      const req = createMockRequest({
        params: { categoryId: '1' },
        query: {
          limit: '5',
          offset: '10',
          sort: 'price',
          order: 'desc'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetProductsByCategory).toHaveBeenCalledWith(1, {
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
        params: { categoryId: '1' },
        query: {
          limit: '-5',
          offset: 'invalid'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetProductsByCategory).not.toHaveBeenCalled();
    });

    it('should handle invalid sort parameter', async () => {
      // Arrange
      const req = createMockRequest({
        params: { categoryId: '1' },
        query: {
          sort: 'invalid'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetProductsByCategory).not.toHaveBeenCalled();
    });

    it('should handle invalid order parameter', async () => {
      // Arrange
      const req = createMockRequest({
        params: { categoryId: '1' },
        query: {
          order: 'invalid'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = categoryController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetProductsByCategory).not.toHaveBeenCalled();
    });
  });
});