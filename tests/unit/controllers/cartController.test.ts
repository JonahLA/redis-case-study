import { Request, Response } from 'express';
import { CartService } from '../../../src/services/cartService';
import cartController from '../../../src/controllers/cartController';
import { createMockRequest, createMockResponse, createMockNext } from '../../utils/mockUtils';
import { AppError } from '../../../src/middleware/errorMiddleware';

// Mock the CartService
jest.mock('../../../src/services/cartService', () => {
  const mockGetCart = jest.fn();
  const mockAddItemToCart = jest.fn();
  const mockUpdateCartItemQuantity = jest.fn();
  const mockRemoveItemFromCart = jest.fn();
  const mockClearCart = jest.fn();
  
  return {
    CartService: jest.fn().mockImplementation(() => ({
      getCart: mockGetCart,
      addItemToCart: mockAddItemToCart,
      updateCartItemQuantity: mockUpdateCartItemQuantity,
      removeItemFromCart: mockRemoveItemFromCart,
      clearCart: mockClearCart
    })),
    mockGetCart,
    mockAddItemToCart,
    mockUpdateCartItemQuantity,
    mockRemoveItemFromCart,
    mockClearCart
  };
});

// Import the mock functions after mocking
const {
  mockGetCart,
  mockAddItemToCart,
  mockUpdateCartItemQuantity,
  mockRemoveItemFromCart,
  mockClearCart
} = jest.requireMock('../../../src/services/cartService');

describe('Cart Controller', () => {
  const mockCart = {
    id: 'test-cart-123',
    items: [
      {
        productId: 1,
        quantity: 2,
        product: {
          id: 1,
          name: 'Test Product 1',
          price: 19.99,
          imageUrl: 'test1.jpg'
        },
        subtotal: 39.98
      }
    ],
    subtotal: 39.98,
    tax: 3.20,
    total: 43.18,
    itemCount: 2
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return cart contents with 200 OK', async () => {
      // Arrange
      mockGetCart.mockResolvedValue(mockCart);
      
      const req = createMockRequest({
        query: { cartId: 'test-cart-123' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetCart).toHaveBeenCalledWith('test-cart-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCart);
    });

    it('should use default cart ID when none provided', async () => {
      // Arrange
      mockGetCart.mockResolvedValue(mockCart);
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetCart).toHaveBeenCalledWith('default-cart');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle service errors', async () => {
      // Arrange
      mockGetCart.mockRejectedValue(new Error('Failed to fetch cart'));
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[0]?.route?.stack?.[0]?.handle;
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

  describe('POST /items', () => {
    it('should add item to cart and return updated cart with 201', async () => {
      // Arrange
      mockAddItemToCart.mockResolvedValue(mockCart);
      
      const req = createMockRequest({
        query: { cartId: 'test-cart-123' },
        body: { productId: 1, quantity: 2 }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockAddItemToCart).toHaveBeenCalledWith('test-cart-123', 1, 2);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCart);
    });

    it('should handle invalid productId', async () => {
      // Arrange
      const req = createMockRequest({
        body: { productId: 'invalid', quantity: 2 }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockAddItemToCart).not.toHaveBeenCalled();
    });

    it('should handle invalid quantity', async () => {
      // Arrange
      const req = createMockRequest({
        body: { productId: 1, quantity: -1 }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockAddItemToCart).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /items/:productId', () => {
    it('should update item quantity and return updated cart', async () => {
      // Arrange
      mockUpdateCartItemQuantity.mockResolvedValue(mockCart);
      
      const req = createMockRequest({
        query: { cartId: 'test-cart-123' },
        params: { productId: '1' },
        body: { quantity: 3 }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockUpdateCartItemQuantity).toHaveBeenCalledWith('test-cart-123', 1, 3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCart);
    });

    it('should handle invalid productId parameter', async () => {
      // Arrange
      const req = createMockRequest({
        params: { productId: 'invalid' },
        body: { quantity: 3 }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockUpdateCartItemQuantity).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /items/:productId', () => {
    it('should remove item and return updated cart', async () => {
      // Arrange
      mockRemoveItemFromCart.mockResolvedValue(mockCart);
      
      const req = createMockRequest({
        query: { cartId: 'test-cart-123' },
        params: { productId: '1' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[3]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockRemoveItemFromCart).toHaveBeenCalledWith('test-cart-123', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCart);
    });

    it('should handle invalid productId parameter', async () => {
      // Arrange
      const req = createMockRequest({
        params: { productId: 'invalid' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[3]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockRemoveItemFromCart).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /', () => {
    it('should clear cart and return empty cart', async () => {
      // Arrange
      const emptyCart = {
        id: 'test-cart-123',
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0
      };
      mockClearCart.mockResolvedValue(emptyCart);
      
      const req = createMockRequest({
        query: { cartId: 'test-cart-123' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[4]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockClearCart).toHaveBeenCalledWith('test-cart-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(emptyCart);
    });

    it('should handle service errors', async () => {
      // Arrange
      mockClearCart.mockRejectedValue(new Error('Failed to clear cart'));
      
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = cartController.stack?.[4]?.route?.stack?.[0]?.handle;
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
});