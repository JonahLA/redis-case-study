import { ProductService } from '../../../src/services/productService';
import { ProductRepository } from '../../../src/repositories/productRepository';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the ProductRepository
jest.mock('../../../src/repositories/productRepository');

describe('ProductService', () => {
  // Mock instances
  let productService: ProductService;
  let mockRepository: jest.Mocked<ProductRepository>;
  let consoleSpy: jest.SpyInstance;
  
  // Test data
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
      categoryId: 2,
      brandId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: 'Test Product 3',
      description: 'Description for Product 3',
      price: new Prisma.Decimal(9.99),
      imageUrl: 'image3.jpg',
      stock: 15,
      categoryId: 1,
      brandId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockProductWithRelations = {
    ...mockProducts[0],
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
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Suppress console.error output
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set up the mocked repository
    mockRepository = new ProductRepository() as jest.Mocked<ProductRepository>;
    
    // Create a new instance of ProductService for each test
    productService = new ProductService();
    
    // Replace the internal repository with our mock
    (productService as any).repository = mockRepository;
  });

  afterEach(() => {
    // Restore console.error
    consoleSpy.mockRestore();
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      // Arrange
      mockRepository.findAll = jest.fn().mockResolvedValue(mockProducts);
      
      // Act
      const result = await productService.getAllProducts();
      
      // Assert
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.findAll = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(productService.getAllProducts())
        .rejects.toThrow();
    });
  });

  describe('getProductById', () => {
    it('should return a product when given a valid ID', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockResolvedValue(mockProducts[0]);
      
      // Act
      const result = await productService.getProductById(1);
      
      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProducts[0]);
    });

    it('should throw an error when product is not found', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(productService.getProductById(999))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(productService.getProductById(1))
        .rejects.toThrow();
    });
  });

  describe('getProductsByCategory', () => {
    it('should return paginated products for a category with default options', async () => {
      // Arrange
      mockRepository.findByCategory = jest.fn().mockResolvedValue(mockProducts);
      
      // Act
      const result = await productService.getProductsByCategory(1, {});
      
      // Assert
      expect(mockRepository.findByCategory).toHaveBeenCalledWith(1);
      expect(result.data.length).toBeLessThanOrEqual(10); // Default limit
      expect(result.pagination).toEqual({
        total: mockProducts.length,
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });

    it('should apply pagination options correctly', async () => {
      // Arrange
      mockRepository.findByCategory = jest.fn().mockResolvedValue([...mockProducts, {
        id: 4,
        name: 'Test Product 4',
        description: 'Description for Product 4',
        price: new Prisma.Decimal(39.99),
        imageUrl: 'image4.jpg',
        stock: 20,
        categoryId: 1,
        brandId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }]); // Add an extra product to ensure hasMore is true
      const options = { limit: 2, offset: 1 };
      
      // Act
      const result = await productService.getProductsByCategory(1, options);
      
      // Assert
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.pagination).toEqual({
        total: 4, // Now we have 4 total items
        limit: 2,
        offset: 1,
        hasMore: true // With 4 items, offset 1, and limit 2, there is indeed more
      });
    });

    it('should sort products by price in ascending order', async () => {
      // Arrange
      mockRepository.findByCategory = jest.fn().mockResolvedValue(mockProducts);
      const options = { sort: 'price', order: 'asc' as const };
      
      // Act
      const result = await productService.getProductsByCategory(1, options);
      
      // Assert
      expect(result.data[0].price.toNumber()).toBeLessThanOrEqual(result.data[1].price.toNumber());
    });

    it('should sort products by name in descending order', async () => {
      // Arrange
      mockRepository.findByCategory = jest.fn().mockResolvedValue(mockProducts);
      const options = { sort: 'name', order: 'desc' as const };
      
      // Act
      const result = await productService.getProductsByCategory(1, options);
      
      // Assert
      const sortedNames = result.data.map(p => p.name);
      expect(sortedNames).toEqual([...sortedNames].sort().reverse());
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.findByCategory = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(productService.getProductsByCategory(1, {}))
        .rejects.toThrow();
    });
  });

  describe('getProductsByBrand', () => {
    it('should return paginated products for a brand with default options', async () => {
      // Arrange
      mockRepository.findByBrand = jest.fn().mockResolvedValue(mockProducts);
      
      // Act
      const result = await productService.getProductsByBrand(1, {});
      
      // Assert
      expect(mockRepository.findByBrand).toHaveBeenCalledWith(1);
      expect(result.data.length).toBeLessThanOrEqual(10); // Default limit
      expect(result.pagination).toEqual({
        total: mockProducts.length,
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });

    it('should apply pagination options correctly', async () => {
      // Arrange
      mockRepository.findByBrand = jest.fn().mockResolvedValue([...mockProducts, {
        id: 4,
        name: 'Test Product 4',
        description: 'Description for Product 4',
        price: new Prisma.Decimal(39.99),
        imageUrl: 'image4.jpg',
        stock: 20,
        categoryId: 1,
        brandId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }]); // Add an extra product to ensure hasMore is true
      const options = { limit: 2, offset: 1 };
      
      // Act
      const result = await productService.getProductsByBrand(1, options);
      
      // Assert
      expect(result.data.length).toBeLessThanOrEqual(2);
      expect(result.pagination).toEqual({
        total: 4, // Now we have 4 total items
        limit: 2,
        offset: 1,
        hasMore: true // With 4 items, offset 1, and limit 2, there is indeed more
      });
    });

    it('should sort products by price in ascending order', async () => {
      // Arrange
      mockRepository.findByBrand = jest.fn().mockResolvedValue(mockProducts);
      const options = { sort: 'price', order: 'asc' as const };
      
      // Act
      const result = await productService.getProductsByBrand(1, options);
      
      // Assert
      expect(result.data[0].price.toNumber()).toBeLessThanOrEqual(result.data[1].price.toNumber());
    });

    it('should sort products by name in descending order', async () => {
      // Arrange
      mockRepository.findByBrand = jest.fn().mockResolvedValue(mockProducts);
      const options = { sort: 'name', order: 'desc' as const };
      
      // Act
      const result = await productService.getProductsByBrand(1, options);
      
      // Assert
      const sortedNames = result.data.map(p => p.name);
      expect(sortedNames).toEqual([...sortedNames].sort().reverse());
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.findByBrand = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(productService.getProductsByBrand(1, {}))
        .rejects.toThrow();
    });
  });

  describe('getProductDetail', () => {
    const mockRelatedProducts = [mockProducts[1], mockProducts[2]];

    it('should return detailed product information with relations', async () => {
      // Arrange
      mockRepository.findByIdWithRelations = jest.fn().mockResolvedValue(mockProductWithRelations);
      mockRepository.findRelatedProducts = jest.fn().mockResolvedValue(mockRelatedProducts);
      
      // Act
      const result = await productService.getProductDetail(1);
      
      // Assert
      expect(mockRepository.findByIdWithRelations).toHaveBeenCalledWith(1);
      expect(mockRepository.findRelatedProducts).toHaveBeenCalledWith(1, mockProductWithRelations.categoryId);
      expect(result).toEqual({
        id: mockProductWithRelations.id,
        name: mockProductWithRelations.name,
        description: mockProductWithRelations.description,
        price: mockProductWithRelations.price.toString(),
        stock: mockProductWithRelations.stock,
        imageUrl: mockProductWithRelations.imageUrl,
        createdAt: mockProductWithRelations.createdAt.toISOString(),
        updatedAt: mockProductWithRelations.updatedAt.toISOString(),
        category: mockProductWithRelations.category,
        brand: mockProductWithRelations.brand,
        relatedProducts: mockRelatedProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price.toString(),
          imageUrl: p.imageUrl
        }))
      });
    });

    it('should throw an error when product is not found', async () => {
      // Arrange
      mockRepository.findByIdWithRelations = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(productService.getProductDetail(999))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.findByIdWithRelations = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(productService.getProductDetail(1))
        .rejects.toThrow();
    });
  });

  describe('decrementStock', () => {
    it('should successfully decrement stock when sufficient quantity exists', async () => {
      // Arrange
      const product = { ...mockProducts[0], stock: 10 };
      mockRepository.findById = jest.fn().mockResolvedValue(product);
      mockRepository.updateStock = jest.fn().mockResolvedValue({ ...product, stock: 8 });
      
      // Act
      await productService.decrementStock(1, 2);
      
      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.updateStock).toHaveBeenCalledWith(1, 8);
    });

    it('should throw an error when insufficient stock exists', async () => {
      // Use mockProducts[0] to ensure we get "Test Product 1" as the name
      const mockProduct = { ...mockProducts[0], stock: 10, name: 'Test Product 1' };
      mockRepository.findById = jest.fn().mockResolvedValue(mockProduct);
      mockRepository.updateStock = jest.fn().mockImplementation(() => {
        throw new Error('Should not be called');
      });
      
      // Act & Assert - Try to decrement by 11, which should fail since we only have 10
      await expect(productService.decrementStock(1, 11))
        .rejects.toThrow(new AppError('Insufficient stock for product: Test Product 1', 400));
      
      // Verify updateStock was never called
      expect(mockRepository.updateStock).not.toHaveBeenCalled();
    });

    it('should throw an error when product is not found', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(productService.decrementStock(999, 1))
        .rejects.toThrow(new AppError('Product with ID 999 not found', 404));
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(productService.decrementStock(1, 1))
        .rejects.toThrow();
    });
  });
});