import { Request, Response } from 'express';
import { OrderService } from '../../../src/services/orderService';
import orderController from '../../../src/controllers/orderController';
import { createMockRequest, createMockResponse, createMockNext } from '../../utils/mockUtils';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the OrderService
jest.mock('../../../src/services/orderService', () => {
  const mockCreateOrder = jest.fn();
  const mockGetOrdersByUser = jest.fn();
  const mockGetOrderById = jest.fn();
  const mockCompleteOrder = jest.fn();
  
  return {
    OrderService: jest.fn().mockImplementation(() => ({
      createOrder: mockCreateOrder,
      getOrdersByUser: mockGetOrdersByUser,
      getOrderById: mockGetOrderById,
      completeOrder: mockCompleteOrder
    })),
    mockCreateOrder,
    mockGetOrdersByUser,
    mockGetOrderById,
    mockCompleteOrder
  };
});

// Import the mock functions after mocking
const {
  mockCreateOrder,
  mockGetOrdersByUser,
  mockGetOrderById,
  mockCompleteOrder
} = jest.requireMock('../../../src/services/orderService');

describe('Order Controller', () => {
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';

  const mockShippingAddress = {
    name: 'John Doe',
    street: '123 Main St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Test Country'
  };

  const mockPaymentDetails = {
    method: 'credit_card',
    simulatePayment: true
  };

  const mockOrder = {
    id: mockOrderId,
    userId: mockUserId,
    items: [
      {
        id: 1,
        productId: 1,
        productName: 'Test Product',
        quantity: 2,
        unitPrice: new Prisma.Decimal(19.99),
        subtotal: new Prisma.Decimal(39.98),
        product: {
          id: 1,
          name: 'Test Product',
          price: new Prisma.Decimal(19.99),
          imageUrl: 'test.jpg'
        }
      }
    ],
    subtotal: new Prisma.Decimal(39.98),
    tax: new Prisma.Decimal(3.20),
    shipping: new Prisma.Decimal(5.00),
    total: new Prisma.Decimal(48.18),
    status: 'pending',
    shippingAddress: mockShippingAddress,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /checkout', () => {
    it('should create order and return 201 Created', async () => {
      // Arrange
      mockCreateOrder.mockResolvedValue(mockOrder);
      
      const req = createMockRequest({
        headers: { 'user-id': mockUserId },
        body: {
          shippingAddress: mockShippingAddress,
          paymentDetails: mockPaymentDetails
        }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockCreateOrder).toHaveBeenCalledWith(
        mockUserId,
        mockShippingAddress,
        mockPaymentDetails
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    it('should handle missing required fields', async () => {
      // Arrange
      const req = createMockRequest({
        headers: { 'user-id': mockUserId },
        body: { paymentDetails: mockPaymentDetails }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[0]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockCreateOrder).not.toHaveBeenCalled();
    });
  });

  describe('GET /orders', () => {
    it('should return user orders with 200 OK', async () => {
      // Arrange
      mockGetOrdersByUser.mockResolvedValue([mockOrder]);
      
      const req = createMockRequest({
        headers: { 'user-id': mockUserId }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetOrdersByUser).toHaveBeenCalledWith(mockUserId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ orders: [mockOrder] });
    });

    it('should handle service errors', async () => {
      // Arrange
      mockGetOrdersByUser.mockRejectedValue(new Error('Database error'));
      
      const req = createMockRequest({
        headers: { 'user-id': mockUserId }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[1]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('GET /orders/:orderId', () => {
    it('should return order by ID with 200 OK', async () => {
      // Arrange
      mockGetOrderById.mockResolvedValue(mockOrder);
      
      const req = createMockRequest({
        headers: { 'user-id': mockUserId },
        params: { orderId: mockOrderId }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockGetOrderById).toHaveBeenCalledWith(mockOrderId, mockUserId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockOrder);
    });

    it('should handle missing order ID', async () => {
      // Arrange
      const req = createMockRequest({
        headers: { 'user-id': mockUserId },
        params: {}
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockGetOrderById).not.toHaveBeenCalled();
    });

    it('should handle order not found', async () => {
      // Arrange
      mockGetOrderById.mockRejectedValue(new AppError('Order not found', 404));
      
      const req = createMockRequest({
        headers: { 'user-id': mockUserId },
        params: { orderId: 'non-existent' }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[2]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('PATCH /orders/:orderId/complete', () => {
    it('should complete order and return updated order', async () => {
      // Arrange
      const completedOrder = {
        ...mockOrder,
        status: 'completed',
        updatedAt: new Date()
      };
      mockCompleteOrder.mockResolvedValue(completedOrder);
      
      const req = createMockRequest({
        headers: { 'user-id': mockUserId },
        params: { orderId: mockOrderId }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[3]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(mockCompleteOrder).toHaveBeenCalledWith(mockOrderId, mockUserId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(completedOrder);
    });

    it('should handle missing order ID', async () => {
      // Arrange
      const req = createMockRequest({
        headers: { 'user-id': mockUserId },
        params: {}
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[3]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockCompleteOrder).not.toHaveBeenCalled();
    });

    it('should handle completion errors', async () => {
      // Arrange
      mockCompleteOrder.mockRejectedValue(new AppError('Order already completed', 400));
      
      const req = createMockRequest({
        headers: { 'user-id': mockUserId },
        params: { orderId: mockOrderId }
      });
      const res = createMockResponse();
      const next = createMockNext();
      
      const routeHandler = orderController.stack?.[3]?.route?.stack?.[0]?.handle;
      expect(routeHandler).toBeDefined();
      if (!routeHandler) return;
      
      // Act
      await routeHandler(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});