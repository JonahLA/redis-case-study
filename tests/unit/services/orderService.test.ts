import { OrderService } from '../../../src/services/orderService';
import { OrderRepository } from '../../../src/repositories/orderRepository';
import { CartService } from '../../../src/services/cartService';
import { ProductService } from '../../../src/services/productService';
import { InventoryService } from '../../../src/services/inventoryService';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { PaymentDetails } from '../../../src/types/order';
import { Prisma } from '@prisma/client';

// Define types from Prisma for testing
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { 
    items: {
      include: {
        product: true
      }
    }
  }
}>;

type OrderItem = Prisma.OrderItemGetPayload<{
  include: {
    product: true
  }
}>;

// Define cart item type to match CartService
interface CartItem {
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
  subtotal: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

// Mock the dependencies
jest.mock('../../../src/repositories/orderRepository');
jest.mock('../../../src/services/cartService');
jest.mock('../../../src/services/productService');
jest.mock('../../../src/services/inventoryService');

describe('OrderService', () => {
  // Mock instances
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<OrderRepository>;
  let mockCartService: jest.Mocked<CartService>;
  let mockProductService: jest.Mocked<ProductService>;
  let mockInventoryService: jest.Mocked<InventoryService>;
  let consoleSpy: jest.SpyInstance;
  
  // Test data
  const testUserId = 'user123';
  const testOrderId = 'order123';
  const testCartId = 'cart123';
  
  const mockAddress = {
    name: 'John Doe',
    street: '123 Main St',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Test Country'
  };

  const mockPaymentDetails: PaymentDetails = {
    method: 'credit_card',
    simulatePayment: true
  };
  
  const mockOrder: OrderWithRelations = {
    id: testOrderId,
    userId: testUserId,
    status: 'pending',
    subtotal: new Prisma.Decimal(20),
    tax: new Prisma.Decimal(1.6),
    shipping: new Prisma.Decimal(10),
    total: new Prisma.Decimal(31.6),
    shippingName: mockAddress.name,
    shippingStreet: mockAddress.street,
    shippingCity: mockAddress.city,
    shippingState: mockAddress.state,
    shippingZip: mockAddress.zipCode,
    shippingCountry: mockAddress.country,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [{
      id: 1,
      orderId: testOrderId,
      productId: 1,
      productName: 'Test Product',
      quantity: 2,
      unitPrice: new Prisma.Decimal(10),
      subtotal: new Prisma.Decimal(20),
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: 1,
        name: 'Test Product',
        description: 'Test Description',
        price: new Prisma.Decimal(10),
        stock: 10,
        imageUrl: 'test.jpg',
        categoryId: 1,
        brandId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }]
  };

  const mockCart: Cart = {
    id: testCartId,
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
      },
      {
        productId: 2,
        quantity: 1,
        product: {
          id: 2,
          name: 'Test Product 2',
          price: 29.99,
          imageUrl: 'test2.jpg'
        },
        subtotal: 29.99
      }
    ],
    subtotal: 69.97,
    tax: 5.60,
    total: 75.57,
    itemCount: 3
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Suppress console.error output
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set up the mocked dependencies
    mockOrderRepository = new OrderRepository() as jest.Mocked<OrderRepository>;
    mockCartService = new CartService() as jest.Mocked<CartService>;
    mockProductService = new ProductService() as jest.Mocked<ProductService>;
    mockInventoryService = new InventoryService() as jest.Mocked<InventoryService>;
    
    // Create a new instance of OrderService for each test
    orderService = new OrderService();
    
    // Replace the internal dependencies with our mocks
    (orderService as any).repository = mockOrderRepository;
    (orderService as any).cartService = mockCartService;
    (orderService as any).productService = mockProductService;
    (orderService as any).inventoryService = mockInventoryService;
  });

  afterEach(() => {
    // Restore console.error
    consoleSpy.mockRestore();
  });

  describe('createOrder', () => {
    it('should successfully create an order', async () => {
      // Arrange
      mockCartService.getCart = jest.fn().mockResolvedValue({ ...mockCart, id: testCartId });
      mockOrderRepository.createOrder = jest.fn().mockResolvedValue(mockOrder);
      mockInventoryService.adjustInventoryBatch = jest.fn().mockResolvedValue(undefined);
      mockCartService.clearCart = jest.fn().mockResolvedValue({ ...mockCart, items: [] });
      
      // Act
      const result = await orderService.createOrder(testUserId, mockAddress, mockPaymentDetails);
      
      // Assert
      expect(mockCartService.getCart).toHaveBeenCalledWith(testUserId);
      expect(mockOrderRepository.createOrder).toHaveBeenCalledWith({
        userId: testUserId,
        shippingAddress: mockAddress,
        subtotal: mockCart.subtotal,
        tax: mockCart.tax,
        total: mockCart.total,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: 1,
            productName: 'Test Product 1',
            quantity: 2,
            unitPrice: 19.99,
            subtotal: 39.98
          }),
          expect.objectContaining({
            productId: 2,
            productName: 'Test Product 2',
            quantity: 1,
            unitPrice: 29.99,
            subtotal: 29.99
          })
        ])
      });
      expect(mockInventoryService.adjustInventoryBatch).toHaveBeenCalledWith([
        { productId: 1, quantity: -2, reason: `Order #${testOrderId}` },
        { productId: 2, quantity: -1, reason: `Order #${testOrderId}` }
      ]);
      expect(mockCartService.clearCart).toHaveBeenCalledWith(testUserId);
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
      await expect(orderService.createOrder(testUserId, mockAddress, mockPaymentDetails))
        .rejects.toThrow(new AppError('Cannot checkout with an empty cart', 400));
    });
    
    it('should throw an error when cart retrieval fails', async () => {
      // Arrange
      mockCartService.getCart = jest.fn().mockImplementation(() => {
        throw new Error('Cart retrieval failed');
      });
      
      // Act & Assert
      await expect(orderService.createOrder(testUserId, mockAddress, mockPaymentDetails))
        .rejects.toThrow(new AppError('Failed to retrieve cart', 500));
    });
    
    it('should throw an error when order creation fails', async () => {
      // Arrange
      mockCartService.getCart = jest.fn().mockResolvedValue(mockCart);
      mockOrderRepository.createOrder = jest.fn().mockImplementation(() => {
        throw new Error('Order creation failed');
      });
      
      // Act & Assert
      await expect(orderService.createOrder(testUserId, mockAddress, mockPaymentDetails))
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
      await expect(orderService.createOrder(testUserId, mockAddress, mockPaymentDetails))
        .rejects.toThrow(new AppError('Failed to adjust inventory', 500));
    });
  });

  describe('getOrdersByUser', () => {
    it('should return orders for a user', async () => {
      // Arrange
      mockOrderRepository.findByUserId = jest.fn().mockResolvedValue([mockOrder]);
      
      // Act
      const result = await orderService.getOrdersByUser(testUserId);
      
      // Assert
      expect(mockOrderRepository.findByUserId).toHaveBeenCalledWith(testUserId); 
      expect(result).toEqual([mockOrder]);
    });
    
    it('should throw an error when order retrieval fails', async () => {
      // Arrange
      mockOrderRepository.findByUserId = jest.fn().mockImplementation(() => {
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
      await expect(orderService.getOrderById('999', testUserId))
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
      const completedOrder = {
        ...mockOrder,
        status: 'completed'
      };
      mockOrderRepository.findById = jest.fn().mockResolvedValue(mockOrder);
      mockOrderRepository.updateStatus = jest.fn().mockResolvedValue(completedOrder);
      
      // Act
      const result = await orderService.completeOrder(testOrderId, testUserId);
      
      // Assert
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(testOrderId);
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(testOrderId, 'completed');
      expect(result.status).toBe('completed');
    });
    
    it('should throw an error when order is not found', async () => {
      // Arrange
      mockOrderRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(orderService.completeOrder('999', testUserId))
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
      mockOrderRepository.updateStatus = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Act & Assert
      await expect(orderService.completeOrder(testOrderId, testUserId))
        .rejects.toThrow(new AppError('Failed to update order status', 500));
    });
  });
});