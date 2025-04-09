import { CategoryService } from '../../../src/services/categoryService';
import { CategoryRepository } from '../../../src/repositories/categoryRepository';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the CategoryRepository
jest.mock('../../../src/repositories/categoryRepository');

describe('CategoryService', () => {
  // Mock instances
  let categoryService: CategoryService;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;
  let consoleSpy: jest.SpyInstance;
  
  // Test data
  const mockCategories = [
    {
      id: 1,
      name: 'Category 1',
      description: 'Description for Category 1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Category 2',
      description: 'Description for Category 2',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  const mockProducts = [
    {
      id: 1,
      name: 'Product A',
      description: 'Description for Product A',
      price: new Prisma.Decimal(19.99),
      imageUrl: 'imageA.jpg',
      stock: 10,
      brandId: 1,
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Product B',
      description: 'Description for Product B',
      price: new Prisma.Decimal(29.99),
      imageUrl: 'imageB.jpg',
      stock: 5,
      brandId: 2,
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: 'Product C',
      description: 'Description for Product C',
      price: new Prisma.Decimal(9.99),
      imageUrl: 'imageC.jpg',
      stock: 15,
      brandId: 1,
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Suppress console.error output
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set up the mocked repository
    mockCategoryRepository = new CategoryRepository() as jest.Mocked<CategoryRepository>;
    
    // Create a new instance of CategoryService for each test
    categoryService = new CategoryService();
    
    // Replace the internal repository with our mock
    (categoryService as any).repository = mockCategoryRepository;
  });

  afterEach(() => {
    // Restore console.error
    consoleSpy.mockRestore();
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      // Arrange
      mockCategoryRepository.findAll = jest.fn().mockResolvedValue(mockCategories);
      
      // Act
      const result = await categoryService.getAllCategories();
      
      // Assert
      expect(mockCategoryRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCategories);
      expect(result.length).toBe(2);
    });
    
    it('should return empty array when no categories exist', async () => {
      // Arrange
      mockCategoryRepository.findAll = jest.fn().mockResolvedValue([]);
      
      // Act
      const result = await categoryService.getAllCategories();
      
      // Assert
      expect(mockCategoryRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
    
    it('should propagate repository errors', async () => {
      // Arrange
      mockCategoryRepository.findAll = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(categoryService.getAllCategories()).rejects.toThrow('Database error');
    });
  });
  
  describe('getCategoryById', () => {
    it('should return a category when a valid ID is provided', async () => {
      // Arrange
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      
      // Act
      const result = await categoryService.getCategoryById(1);
      
      // Assert
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategories[0]);
    });
    
    it('should throw an AppError when category is not found', async () => {
      // Arrange
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(categoryService.getCategoryById(999))
        .rejects.toThrow(new AppError('Category with ID 999 not found', 404));
    });
    
    it('should propagate repository errors', async () => {
      // Arrange
      mockCategoryRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(categoryService.getCategoryById(1)).rejects.toThrow('Database error');
    });
  });
  
  describe('getProductsByCategory', () => {
    it('should return paginated products for a valid category ID with default options', async () => {
      // Arrange
      const categoryWithProducts = {
        ...mockCategories[0],
        products: mockProducts
      };
      
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue(categoryWithProducts);
      
      // Act
      const result = await categoryService.getProductsByCategory(1, {});
      
      // Assert
      expect(mockCategoryRepository.findById).toHaveBeenCalledWith(1);
      expect(mockCategoryRepository.findByIdWithProducts).toHaveBeenCalledWith(1);
      expect(result.data.length).toBe(3);
      expect(result.pagination).toEqual({
        total: 3,
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });
    
    it('should return products sorted by name in ascending order by default', async () => {
      // Arrange
      const categoryWithProducts = {
        ...mockCategories[0],
        products: [mockProducts[1], mockProducts[0], mockProducts[2]] // Intentionally out of order
      };
      
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue(categoryWithProducts);
      
      // Act
      const result = await categoryService.getProductsByCategory(1, {});
      
      // Assert
      expect(result.data[0].name).toBe('Product A');
      expect(result.data[1].name).toBe('Product B');
      expect(result.data[2].name).toBe('Product C');
    });
    
    it('should return products sorted by name in descending order', async () => {
      // Arrange
      const categoryWithProducts = {
        ...mockCategories[0],
        products: mockProducts
      };
      
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue(categoryWithProducts);
      
      // Act
      const result = await categoryService.getProductsByCategory(1, { sort: 'name', order: 'desc' });
      
      // Assert
      expect(result.data[0].name).toBe('Product C');
      expect(result.data[1].name).toBe('Product B');
      expect(result.data[2].name).toBe('Product A');
    });
    
    it('should return products sorted by price in ascending order', async () => {
      // Arrange
      const categoryWithProducts = {
        ...mockCategories[0],
        products: mockProducts
      };
      
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue(categoryWithProducts);
      
      // Act
      const result = await categoryService.getProductsByCategory(1, { sort: 'price', order: 'asc' });
      
      // Assert - Prices: Product C ($9.99), Product A ($19.99), Product B ($29.99)
      expect(result.data[0].id).toBe(3);
      expect(result.data[1].id).toBe(1);
      expect(result.data[2].id).toBe(2);
    });
    
    it('should return products sorted by price in descending order', async () => {
      // Arrange
      const categoryWithProducts = {
        ...mockCategories[0],
        products: mockProducts
      };
      
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue(categoryWithProducts);
      
      // Act
      const result = await categoryService.getProductsByCategory(1, { sort: 'price', order: 'desc' });
      
      // Assert - Prices in descending order: Product B ($29.99), Product A ($19.99), Product C ($9.99)
      expect(result.data[0].id).toBe(2);
      expect(result.data[1].id).toBe(1);
      expect(result.data[2].id).toBe(3);
    });
    
    it('should apply pagination correctly', async () => {
      // Arrange
      const categoryWithProducts = {
        ...mockCategories[0],
        products: mockProducts
      };
      
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue(categoryWithProducts);
      
      // Act - Requesting first page with 2 items per page
      const result = await categoryService.getProductsByCategory(1, { limit: 2, offset: 0 });
      
      // Assert
      expect(result.data.length).toBe(2);
      expect(result.pagination).toEqual({
        total: 3,
        limit: 2,
        offset: 0,
        hasMore: true
      });
    });
    
    it('should apply pagination with offset correctly', async () => {
      // Arrange
      const categoryWithProducts = {
        ...mockCategories[0],
        products: mockProducts
      };
      
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue(categoryWithProducts);
      
      // Act - Requesting second page with 2 items per page (offset 2)
      const result = await categoryService.getProductsByCategory(1, { limit: 2, offset: 2 });
      
      // Assert
      expect(result.data.length).toBe(1); // Only one product left on this page
      expect(result.pagination).toEqual({
        total: 3,
        limit: 2,
        offset: 2,
        hasMore: false
      });
    });
    
    it('should throw an AppError when category is not found', async () => {
      // Arrange
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(categoryService.getProductsByCategory(999, {}))
        .rejects.toThrow(new AppError('Category with ID 999 not found', 404));
    });
    
    it('should return empty data when category exists but has no products', async () => {
      // Arrange
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue({
        ...mockCategories[0],
        products: []
      });
      
      // Act
      const result = await categoryService.getProductsByCategory(1, {});
      
      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });
    
    it('should return empty data when category has null products', async () => {
      // Arrange
      mockCategoryRepository.findById = jest.fn().mockResolvedValue(mockCategories[0]);
      mockCategoryRepository.findByIdWithProducts = jest.fn().mockResolvedValue({
        ...mockCategories[0],
        products: null
      });
      
      // Act
      const result = await categoryService.getProductsByCategory(1, {});
      
      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });
  });
});