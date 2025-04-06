import { OrderService } from '../../../src/services/orderService';
import { OrderRepository } from '../../../src/repositories/orderRepository';
import { CartService } from '../../../src/services/cartService';
import { InventoryService } from '../../../src/services/inventoryService';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the dependencies
jest.mock('../../../src/repositories/orderRepository');
jest.mock('../../../src/services/cartService');
jest.mock('../../../src/services/inventoryService');

describe('OrderService', () => {
  // Mock instances
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockCartService: jest.Mocked<CartService>;
  let mockInventoryService: jest.Mocked<InventoryService>;
  
  // Test data
  const testUserId = 'user-123';
  const testCartId = 'cart-123';
  const testOrderId = 1;
  
  const mockCart = {
    id: testCartId,
    items: [
      {
        productId: 1,
        quantity: 2,
        product: {
          id: 1,
          name: 'Test Product 1',
          price: 19.99,
          imageUrl: 'test-url-1.jpg'
        },
        subtotal: 39.98
      },
      {
        productId: 2,
        quantity: 1,
        product: {
          id: 2,
          name: 'Test Product 2',
          price: 29.99,
          imageUrl: 'test-url-2.jpg'
        },
        subtotal: 29.99
      }
    ],
    subtotal: 69.97,
    tax: 5.6,
    total: 75.57,
    itemCount: 3
  };
  
  const mockOrderItems = [
    {
      productId: 1,
      quantity: 2,
      price: new Prisma.Decimal(19.99),
      subtotal: new Prisma.Decimal(39.98)
    },
    {
      productId: 2,
      quantity: 1,
      price: new Prisma.Decimal(29.99),
      subtotal: new Prisma.Decimal(29.99)
    }
  ];
  
  const mockOrder = {
    id: testOrderId,
    userId: testUserId,
    subtotal: new Prisma.Decimal(69.97),
    tax: new Prisma.Decimal(5.6),
    total: new Prisma.Decimal(75.57),
    orderItems: mockOrderItems,
    status: 'pending',
    shippingAddress: '123 Test St, Test City',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up the mocked dependencies
    mockOrderRepository = new OrderRepository() as jest.Mocked<OrderRepository>;
    mockCartService = new CartService() as jest.Mocked<CartService>;
    mockInventoryService = new InventoryService() as jest.Mocked<InventoryService>;
    
    // Create a new instance of OrderService for each test
    orderService = new OrderService();
    
    // Replace the internal dependencies with our mocks
    (orderService as any).orderRepository = mockOrderRepository;
    (orderService as any).cartService = mockCartService;
    (orderService as any).inventoryService = mockInventoryService;
  });

  describe('createOrder', () => {
    const mockAddress = '123 Test St, Test City';
    
    it('should successfully create an order', async () => {
      // Arrange
      mockCartService.getCart = jest.fn().mockResolvedValue(mockCart);
      mockOrderRepository.createOrder = jest.fn().mockResolvedValue(mockOrder);
      mockInventoryService.adjustInventoryBatch = jest.fn().mockResolvedValue(undefined);
      mockCartService.clearCart = jest.fn().mockResolvedValue({ ...mockCart, items: [] });
      
      // Act
      const result = await orderService.createOrder(testUserId, testCartId, mockAddress);
      
      // Assert
      expect(mockCartService.getCart).toHaveBeenCalledWith(testCartId);
      expect(mockOrderRepository.createOrder).toHaveBeenCalledWith({
        userId: testUserId,
        shippingAddress: mockAddress,
        subtotal: mockCart.subtotal,
        tax: mockCart.tax,
        total: mockCart.total,
        orderItems: expect.arrayContaining([
          expect.objectContaining({
            productId: 1,
            quantity: 2,
            price: 19.99,
            subtotal: 39.98
          }),
          expect.objectContaining({
            productId: 2,
            quantity: 1,
            price: 29.99,
            subtotal: 29.99
          })
        ])
      });
      expect(mockInventoryService.adjustInventoryBatch).toHaveBeenCalledWith([
        { productId: 1, quantity: -2, reason: `Order #${testOrderId}` },
        { productId: 2, quantity: -1, reason: `Order #${testOrderId}` }
      ]);
      expect(mockCartService.clearCart).toHaveBeenCalledWith(testCartId);
      expect(result).toEqual(mockOrder);
    });
    
    it('should throw an error when cart is empty', async () => {
      // Arrange
      mockCartService.getCart = jest.fn().mockResolvedValue({
        id: testCartId,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0
      });
      
      // Act & Assert
      await expect(orderService.createOrder(testUserId, testCartId, mockAddress))
        .rejects.toThrow(new AppError('Cannot create order with empty cart', 400));
    });
    
    it('should throw an error when cart retrieval fails', async () => {
      // Arrange
      mockCartService.getCart = jest.fn().mockImplementation(() => {
        throw new Error('Cart retrieval failed');
      });
      
      // Act & Assert
      await expect(orderService.createOrder(testUserId, testCartId, mockAddress))
        .rejects.toThrow(new AppError('Failed to retrieve cart', 500));
    });
    
    it('should throw an error when order creation fails', async () => {
      // Arrange
      mockCartService.getCart = jest.fn().mockResolvedValue(mockCart);
      mockOrderRepository.createOrder = jest.fn().mockImplementation(() => {
        throw new Error('Order creation failed');
      });
      
      // Act & Assert
      await expect(orderService.createOrder(testUserId, testCartId, mockAddress))
        .rejects.toThrow(new AppError('Failed to create order', 500));
    });
    
    it('should throw an error when inventory adjustment fails', async () => {
      // Arrange
      mockCartService.getCart = jest.fn().mockResolvedValue(mockCart);
      mockOrderRepository.createOrder = jest.fn().mockResolvedValue(mockOrder);
      mockInventoryService.adjustInventoryBatch = jest.fn().mockImplementation(() => {
        throw new Error('Insufficient stock');
      });
      
      // Act & Assert
      await expect(orderService.createOrder(testUserId, testCartId, mockAddress))
        .rejects.toThrow(new AppError('Failed to adjust inventory', 500));
    });
  });

  describe('getOrdersByUser', () => {
    it('should return orders for a user', async () => {
      // Arrange
      mockOrderRepository.findByUser = jest.fn().mockResolvedValue([mockOrder]);
      
      // Act
      const result = await orderService.getOrdersByUser(testUserId);
      
      // Assert
      expect(mockOrderRepository.findByUser).toHaveBeenCalledWith(testUserId);
      expect(result).toEqual([mockOrder]);
    });
    
    it('should throw an error when order retrieval fails', async () => {
      // Arrange
      mockOrderRepository.findByUser = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(orderService.getOrdersByUser(testUserId))
        .rejects.toThrow(new AppError('Failed to retrieve orders', 500));
    });
  });

  describe('getOrderById', () => {
    it('should return an order by ID', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue(mockOrder);
      
      // Act
      const result = await orderService.getOrderById(testOrderId, testUserId);
      
      // Assert
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(testOrderId);
      expect(result).toEqual(mockOrder);
    });
    
    it('should throw an error when order is not found', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(orderService.getOrderById(999, testUserId))
        .rejects.toThrow(new AppError('Order not found', 404));
    });
    
    it('should throw an error when user is not authorized', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue({
        ...mockOrder,
        userId: 'different-user'
      });
      
      // Act & Assert
      await expect(orderService.getOrderById(testOrderId, testUserId))
        .rejects.toThrow(new AppError('Not authorized to view this order', 403));
    });
    
    it('should throw an error when order retrieval fails', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(orderService.getOrderById(testOrderId, testUserId))
        .rejects.toThrow(new AppError('Failed to retrieve order', 500));
    });
  });
  
  describe('completeOrder', () => {
    it('should mark order as completed', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue(mockOrder);
      mockOrderRepository.updateOrder = jest.fn().mockResolvedValue({
        ...mockOrder,
        status: 'completed'
      });
      
      // Act
      const result = await orderService.completeOrder(testOrderId, testUserId);
      
      // Assert
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(testOrderId);
      expect(mockOrderRepository.updateOrder).toHaveBeenCalledWith(testOrderId, {
        status: 'completed'
      });
      expect(result.status).toBe('completed');
    });
    
    it('should throw an error when order is not found', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(orderService.completeOrder(999, testUserId))
        .rejects.toThrow(new AppError('Order not found', 404));
    });
    
    it('should throw an error when user is not authorized', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue({
        ...mockOrder,
        userId: 'different-user'
      });
      
      // Act & Assert
      await expect(orderService.completeOrder(testOrderId, testUserId))
        .rejects.toThrow(new AppError('Not authorized to update this order', 403));
    });
    
    it('should throw an error when order is already completed', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue({
        ...mockOrder,
        status: 'completed'
      });
      
      // Act & Assert
      await expect(orderService.completeOrder(testOrderId, testUserId))
        .rejects.toThrow(new AppError('Order is already completed', 400));
    });
    
    it('should throw an error when order update fails', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue(mockOrder);
      mockOrderRepository.updateOrder = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(orderService.completeOrder(testOrderId, testUserId))
        .rejects.toThrow(new AppError('Failed to update order status', 500));
    });
  });
});