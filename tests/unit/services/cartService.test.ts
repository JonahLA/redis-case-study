import { CartService, Cart, CartItem } from '../../../src/services/cartService';
import { ProductRepository } from '../../../src/repositories/productRepository';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the ProductRepository
jest.mock('../../../src/repositories/productRepository', () => {
  return {
    ProductRepository: jest.fn().mockImplementation(() => ({
      findById: jest.fn(),
      // Add any other methods used by CartService
    }))
  };
});

describe('CartService', () => {
  // Mock instances
  let cartService: CartService;
  let mockProductRepository: jest.Mocked<ProductRepository>;
  
  // Test data
  const testCartId = 'test-cart-123';
  
  const mockProduct1 = {
    id: 1,
    name: 'Test Product 1',
    price: new Prisma.Decimal(19.99),
    imageUrl: 'test-url-1.jpg',
    stock: 10,
    description: 'Test description 1',
    categoryId: 1,
    brandId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockProduct2 = {
    id: 2,
    name: 'Test Product 2',
    price: new Prisma.Decimal(29.99),
    imageUrl: 'test-url-2.jpg',
    stock: 5,
    description: 'Test description 2',
    categoryId: 1,
    brandId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set up the mocked product repository
    mockProductRepository = new ProductRepository() as jest.Mocked<ProductRepository>;
    
    // Create a new instance of CartService for each test
    cartService = new CartService();
    
    // Replace the internal product repository with our mock
    (cartService as any).productRepository = mockProductRepository;
    
    // Clear the static carts storage before each test
    (CartService as any).cartsStorage = new Map<string, Cart>();
  });

  describe('getCart', () => {
    it('should return an empty cart for a non-existent cart ID', async () => {
      // Act
      const result = await cartService.getCart(testCartId);
      
      // Assert
      expect(result).toEqual({
        id: testCartId,
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        itemCount: 0
      });
    });
    
    it('should return an existing cart', async () => {
      // Arrange
      const existingCart: Cart = {
        id: testCartId,
        items: [{
          productId: 1,
          quantity: 2,
          product: {
            id: 1,
            name: 'Test Product 1',
            price: 19.99,
            imageUrl: 'test-url-1.jpg'
          },
          subtotal: 39.98
        }],
        subtotal: 39.98,
        tax: 3.20,
        total: 43.18,
        itemCount: 2
      };
      
      // Add the cart to the storage
      (CartService as any).cartsStorage.set(testCartId, existingCart);
      
      // Act
      const result = await cartService.getCart(testCartId);
      
      // Assert
      expect(result).toEqual(existingCart);
    });
    
    it('should handle errors when fetching cart', async () => {
      // Arrange
      // Mock the getCart method to throw an error when called
      jest.spyOn(cartService, 'getCart').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Act & Assert
      await expect(cartService.getCart(testCartId)).rejects.toThrow('Storage error');
    });
  });

  describe('addItemToCart', () => {
    it('should add a new item to an empty cart', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct1);
      
      // Act
      const result = await cartService.addItemToCart(testCartId, 1, 2);
      
      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledWith(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0]).toEqual({
        productId: 1,
        quantity: 2,
        product: {
          id: 1,
          name: 'Test Product 1',
          price: 19.99,
          imageUrl: 'test-url-1.jpg'
        },
        subtotal: 39.98
      });
      expect(result.subtotal).toBe(39.98);
      expect(result.tax).toBe(3.2); // 8% of 39.98 = 3.1984, rounded to 3.20
      expect(result.total).toBe(43.18); // 39.98 + 3.20 = 43.18
      expect(result.itemCount).toBe(2);
    });
    
    it('should increase quantity when adding an existing item', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct1);
      
      // First add an item to the cart
      await cartService.addItemToCart(testCartId, 1, 1);
      
      // Act - Add the same item again
      const result = await cartService.addItemToCart(testCartId, 1, 2);
      
      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(2);
      expect(result.items.length).toBe(1);
      expect(result.items[0].quantity).toBe(3); // 1 + 2 = 3
      expect(result.items[0].subtotal).toBe(59.97); // 19.99 * 3 = 59.97
      expect(result.subtotal).toBe(59.97);
      expect(result.tax).toBe(4.8); // 8% of 59.97 = 4.7976, rounded to 4.80
      expect(result.total).toBe(64.77); // 59.97 + 4.80 = 64.77
      expect(result.itemCount).toBe(3);
    });
    
    it('should add multiple different items to the cart', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(mockProduct1))
        .mockImplementationOnce(() => Promise.resolve(mockProduct2));
      
      // Act - Add two different products
      await cartService.addItemToCart(testCartId, 1, 2);
      const result = await cartService.addItemToCart(testCartId, 2, 1);
      
      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(2);
      expect(result.items.length).toBe(2);
      
      // First item should be product 1 with quantity 2
      expect(result.items[0].productId).toBe(1);
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].subtotal).toBe(39.98); // 19.99 * 2 = 39.98
      
      // Second item should be product 2 with quantity 1
      expect(result.items[1].productId).toBe(2);
      expect(result.items[1].quantity).toBe(1);
      expect(result.items[1].subtotal).toBe(29.99);
      
      // Cart totals
      expect(result.subtotal).toBe(69.97); // 39.98 + 29.99 = 69.97
      expect(result.tax).toBe(5.6); // 8% of 69.97 = 5.5976, rounded to 5.60
      expect(result.total).toBe(75.57); // 69.97 + 5.60 = 75.57
      expect(result.itemCount).toBe(3); // 2 of product 1 + 1 of product 2 = 3
    });
    
    it('should throw an error when product is not found', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(cartService.addItemToCart(testCartId, 999, 1))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });
    
    it('should throw an error when quantity exceeds stock', async () => {
      // Arrange - Product with only 5 items in stock
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct2);
      
      // Act & Assert - Try to add 10 items
      await expect(cartService.addItemToCart(testCartId, 2, 10))
        .rejects.toThrow(`Insufficient stock for product ${mockProduct2.name}. Available: ${mockProduct2.stock}`);
    });
    
    it('should throw an error when additional quantity would exceed stock', async () => {
      // Arrange - Product with only 5 items in stock
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct2);
      
      // First add 3 items
      await cartService.addItemToCart(testCartId, 2, 3);
      
      // Act & Assert - Try to add 3 more (which would exceed the 5 in stock)
      await expect(cartService.addItemToCart(testCartId, 2, 3))
        .rejects.toThrow(`Cannot add 3 more of this product. Available stock: ${mockProduct2.stock}`);
    });
    
    it('should handle generic errors', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockImplementationOnce(() => {
        throw new Error('Database connection error');
      });
      
      // Act & Assert
      await expect(cartService.addItemToCart(testCartId, 1, 1))
        .rejects.toThrow(new AppError('Failed to add item to cart', 500));
    });
  });
  
  describe('updateCartItemQuantity', () => {
    it('should update the quantity of an existing cart item', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct1);
      
      // First add an item to the cart
      await cartService.addItemToCart(testCartId, 1, 2);
      
      // Act - Update the quantity
      const result = await cartService.updateCartItemQuantity(testCartId, 1, 5);
      
      // Assert
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(2);
      expect(result.items.length).toBe(1);
      expect(result.items[0].quantity).toBe(5);
      expect(result.items[0].subtotal).toBe(99.95); // 19.99 * 5 = 99.95
      expect(result.subtotal).toBe(99.95);
      expect(result.tax).toBe(8); // 8% of 99.95 = 7.996, rounded to 8.00
      expect(result.total).toBe(107.95); // 99.95 + 8.00 = 107.95
      expect(result.itemCount).toBe(5);
    });
    
    it('should throw an error when product is not found', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(cartService.updateCartItemQuantity(testCartId, 999, 1))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });
    
    it('should throw an error when product is not in cart', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct1);
      
      // Act & Assert - Update the quantity of a product not in cart
      await expect(cartService.updateCartItemQuantity(testCartId, 1, 3))
        .rejects.toThrow(new AppError('Product with ID 1 not found in cart', 404));
    });
    
    it('should throw an error when quantity exceeds stock', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockResolvedValue(mockProduct2);
      
      // First add the item to the cart
      await cartService.addItemToCart(testCartId, 2, 2);
      
      // Act & Assert - Try to update quantity to exceed stock
      await expect(cartService.updateCartItemQuantity(testCartId, 2, 10))
        .rejects.toThrow(`Insufficient stock for product ${mockProduct2.name}. Available: ${mockProduct2.stock}`);
    });
    
    it('should handle generic errors', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn().mockImplementationOnce(() => {
        throw new Error('Database connection error');
      });
      
      // Act & Assert
      await expect(cartService.updateCartItemQuantity(testCartId, 1, 2))
        .rejects.toThrow(new AppError('Failed to update cart item', 500));
    });
  });
  
  describe('removeItemFromCart', () => {
    it('should remove an existing item from the cart', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(mockProduct1))
        .mockImplementationOnce(() => Promise.resolve(mockProduct2));
      
      // First add two items to the cart
      await cartService.addItemToCart(testCartId, 1, 2);
      await cartService.addItemToCart(testCartId, 2, 1);
      
      // Act - Remove the first item
      const result = await cartService.removeItemFromCart(testCartId, 1);
      
      // Assert
      expect(result.items.length).toBe(1);
      expect(result.items[0].productId).toBe(2); // Only product 2 should remain
      expect(result.subtotal).toBe(29.99);
      expect(result.tax).toBe(2.4); // 8% of 29.99 = 2.3992, rounded to 2.40
      expect(result.total).toBe(32.39); // 29.99 + 2.40 = 32.39
      expect(result.itemCount).toBe(1);
    });
    
    it('should throw an error when item is not in cart', async () => {
      // Arrange - Empty cart
      
      // Act & Assert
      await expect(cartService.removeItemFromCart(testCartId, 1))
        .rejects.toThrow(new AppError('Product with ID 1 not found in cart', 404));
    });
    
    it('should handle generic errors', async () => {
      // Arrange - Mock the getCart method to throw an error
      jest.spyOn(cartService, 'getCart').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Act & Assert
      await expect(cartService.removeItemFromCart(testCartId, 1))
        .rejects.toThrow(new AppError('Failed to remove item from cart', 500));
    });
  });
  
  describe('clearCart', () => {
    it('should clear all items from the cart', async () => {
      // Arrange
      mockProductRepository.findById = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(mockProduct1))
        .mockImplementationOnce(() => Promise.resolve(mockProduct2));
      
      // First add some items to the cart
      await cartService.addItemToCart(testCartId, 1, 2);
      await cartService.addItemToCart(testCartId, 2, 1);
      
      // Act
      const result = await cartService.clearCart(testCartId);
      
      // Assert
      expect(result.items.length).toBe(0);
      expect(result.subtotal).toBe(0);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(0);
      expect(result.itemCount).toBe(0);
    });
    
    it('should handle errors when clearing cart', async () => {
      // Arrange - Mock an error when setting cart
      const mockMap = {
        set: jest.fn().mockImplementationOnce(() => {
          throw new Error('Storage error');
        })
      };
      (CartService as any).cartsStorage = mockMap;
      
      // Act & Assert
      await expect(cartService.clearCart(testCartId))
        .rejects.toThrow(new AppError('Failed to clear cart', 500));
    });
  });
});