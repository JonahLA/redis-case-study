import { Request, Response } from 'express';
import { ProductService } from '../../../src/services/productService';
import productController from '../../../src/controllers/productController';
import { createMockRequest, createMockResponse, createMockNext } from '../../utils/mockUtils';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the ProductService
jest.mock('../../../src/services/productService', () => {
  const mockGetAllProducts = jest.fn();
  const mockGetProductDetail = jest.fn();
  
  return {
    ProductService: jest.fn().mockImplementation(() => ({
      getAllProducts: mockGetAllProducts,
      getProductDetail: mockGetProductDetail
    })),
    mockGetAllProducts,
    mockGetProductDetail
  };
});

// Import the mock functions after mocking
const { mockGetAllProducts, mockGetProductDetail } = jest.requireMock('../../../src/services/productService');

describe('Product Controller', () => {
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
    },
    {
      id: 2,
      name: 'Test Product 2',
      description: 'Description for Product 2',
      price: new Prisma.Decimal(29.99),
      imageUrl: 'image2.jpg',
      stock: 5,
      categoryId: 1,
      brandId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockProductDetail = {
    id: 1,
    name: 'Test Product 1',
    description: 'Description for Product 1',
    price: '19.99',
    stock: 10,
    imageUrl: 'image1.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: {
      id: 1,
      name: 'Test Category',
      description: 'Test Category Description'
    },
    brand: {
      id: 1,
      name: 'Test Brand',
      description: 'Test Brand Description',
      imageUrl: 'brand-image.jpg'
    },
    relatedProducts: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return all products with 200 OK', async () => {
      // Arrange
      mockGetAllProducts.mockResolvedValue(mockProducts);
      
      // Create mocked Express request, response, and next function objects
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      // Get the route handler directly from the controller router
      const routeHandler = productController.stack?.[0]?.route?.stack?.[0]?.handle;
      
      // Make sure we found the route handler
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act: Execute the route handler
      await routeHandler(req, res, next);
      
      // Assert: Check that the handler called status and json with expected values
      expect(mockGetAllProducts).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      
      // Get the actual argument passed to res.json
      const responseBody = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseBody).toEqual({ products: mockProducts });
    });

    it('should handle service errors', async () => {
      // Arrange
      const errorMessage = 'Database error';
      mockGetAllProducts.mockRejectedValue(new Error(errorMessage));
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = productController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act: Execute the route handler
      await routeHandler(req, res, next);
      
      // Assert: Error should be passed to next()
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('GET /:productId', () => {
    it('should return product detail with 200 OK for valid ID', async () => {
      // Arrange
      mockGetProductDetail.mockResolvedValue(mockProductDetail);
      
      const req = createMockRequest({
        params: { productId: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = productController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act: Execute the route handler
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetProductDetail).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProductDetail);
    });

    it('should handle invalid product ID format', async () => {
      // Arrange
      const req = createMockRequest({
        params: { productId: 'invalid' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = productController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act: Execute the route handler
      await routeHandler(req, res, next);
      
      // Assert: Error should be passed to next()
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetProductDetail).not.toHaveBeenCalled();
    });

    it('should handle product not found error', async () => {
      // Arrange
      mockGetProductDetail.mockRejectedValue(new AppError('Product with ID 999 not found', 404));
      
      const req = createMockRequest({
        params: { productId: '999' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = productController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act: Execute the route handler
      await routeHandler(req, res, next);
      
      // Assert: Error should be passed to next()
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetProductDetail).toHaveBeenCalledWith(999);
    });
  });
});