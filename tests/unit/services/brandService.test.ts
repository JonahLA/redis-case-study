import { BrandService } from '../../../src/services/brandService';
import { BrandRepository } from '../../../src/repositories/brandRepository';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Mock the BrandRepository
jest.mock('../../../src/repositories/brandRepository');

describe('BrandService', () => {
  // Mock instances
  let brandService: BrandService;
  let mockBrandRepository: jest.Mocked<BrandRepository>;
  
  // Test data
  const mockBrands = [
    {
      id: 1,
      name: 'Brand 1',
      description: 'Description for Brand 1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Brand 2',
      description: 'Description for Brand 2',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  const mockProducts = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Description for Product 1',
      price: new Prisma.Decimal(19.99),
      imageUrl: 'image1.jpg',
      stock: 10,
      brandId: 1,
      categoryId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Product 2',
      description: 'Description for Product 2',
      price: new Prisma.Decimal(29.99),
      imageUrl: 'image2.jpg',
      stock: 5,
      brandId: 1,
      categoryId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: 'Product 3',
      description: 'Description for Product 3',
      price: new Prisma.Decimal(9.99),
      imageUrl: 'image3.jpg',
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
    
    // Set up the mocked repository
    mockBrandRepository = new BrandRepository() as jest.Mocked<BrandRepository>;
    
    // Create a new instance of BrandService for each test
    brandService = new BrandService();
    
    // Replace the internal repository with our mock
    (brandService as any).repository = mockBrandRepository;
  });

  describe('getAllBrands', () => {
    it('should return all brands', async () => {
      // Arrange
      mockBrandRepository.findAll = jest.fn().mockResolvedValue(mockBrands);
      
      // Act
      const result = await brandService.getAllBrands();
      
      // Assert
      expect(mockBrandRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockBrands);
      expect(result.length).toBe(2);
    });
    
    it('should return empty array when no brands exist', async () => {
      // Arrange
      mockBrandRepository.findAll = jest.fn().mockResolvedValue([]);
      
      // Act
      const result = await brandService.getAllBrands();
      
      // Assert
      expect(mockBrandRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
    
    it('should propagate repository errors', async () => {
      // Arrange
      mockBrandRepository.findAll = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(brandService.getAllBrands()).rejects.toThrow('Database error');
    });
  });
  
  describe('getBrandById', () => {
    it('should return a brand when a valid ID is provided', async () => {
      // Arrange
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      
      // Act
      const result = await brandService.getBrandById(1);
      
      // Assert
      expect(mockBrandRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBrands[0]);
    });
    
    it('should throw an AppError when brand is not found', async () => {
      // Arrange
      mockBrandRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(brandService.getBrandById(999))
        .rejects.toThrow(new AppError('Brand with ID 999 not found', 404));
    });
    
    it('should propagate repository errors', async () => {
      // Arrange
      mockBrandRepository.findById = jest.fn().mockRejectedValue(new Error('Database error'));
      
      // Act & Assert
      await expect(brandService.getBrandById(1)).rejects.toThrow('Database error');
    });
  });
  
  describe('getProductsByBrand', () => {
    it('should return paginated products for a valid brand ID with default options', async () => {
      // Arrange
      const brandWithProducts = {
        ...mockBrands[0],
        products: mockProducts
      };
      
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue(brandWithProducts);
      
      // Act
      const result = await brandService.getProductsByBrand(1, {});
      
      // Assert
      expect(mockBrandRepository.findById).toHaveBeenCalledWith(1);
      expect(mockBrandRepository.findByIdWithProducts).toHaveBeenCalledWith(1);
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
      const brandWithProducts = {
        ...mockBrands[0],
        products: [mockProducts[1], mockProducts[0], mockProducts[2]] // Intentionally out of order
      };
      
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue(brandWithProducts);
      
      // Act
      const result = await brandService.getProductsByBrand(1, {});
      
      // Assert
      expect(result.data[0].name).toBe('Product 1');
      expect(result.data[1].name).toBe('Product 2');
      expect(result.data[2].name).toBe('Product 3');
    });
    
    it('should return products sorted by name in descending order', async () => {
      // Arrange
      const brandWithProducts = {
        ...mockBrands[0],
        products: mockProducts
      };
      
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue(brandWithProducts);
      
      // Act
      const result = await brandService.getProductsByBrand(1, { sort: 'name', order: 'desc' });
      
      // Assert
      expect(result.data[0].name).toBe('Product 3');
      expect(result.data[1].name).toBe('Product 2');
      expect(result.data[2].name).toBe('Product 1');
    });
    
    it('should return products sorted by price in ascending order', async () => {
      // Arrange
      const brandWithProducts = {
        ...mockBrands[0],
        products: mockProducts
      };
      
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue(brandWithProducts);
      
      // Act
      const result = await brandService.getProductsByBrand(1, { sort: 'price', order: 'asc' });
      
      // Assert - Prices: Product 3 ($9.99), Product 1 ($19.99), Product 2 ($29.99)
      expect(result.data[0].id).toBe(3);
      expect(result.data[1].id).toBe(1);
      expect(result.data[2].id).toBe(2);
    });
    
    it('should return products sorted by price in descending order', async () => {
      // Arrange
      const brandWithProducts = {
        ...mockBrands[0],
        products: mockProducts
      };
      
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue(brandWithProducts);
      
      // Act
      const result = await brandService.getProductsByBrand(1, { sort: 'price', order: 'desc' });
      
      // Assert - Prices in descending order: Product 2 ($29.99), Product 1 ($19.99), Product 3 ($9.99)
      expect(result.data[0].id).toBe(2);
      expect(result.data[1].id).toBe(1);
      expect(result.data[2].id).toBe(3);
    });
    
    it('should apply pagination correctly', async () => {
      // Arrange
      const brandWithProducts = {
        ...mockBrands[0],
        products: mockProducts
      };
      
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue(brandWithProducts);
      
      // Act - Requesting first page with 2 items per page
      const result = await brandService.getProductsByBrand(1, { limit: 2, offset: 0 });
      
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
      const brandWithProducts = {
        ...mockBrands[0],
        products: mockProducts
      };
      
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue(brandWithProducts);
      
      // Act - Requesting second page with 2 items per page (offset 2)
      const result = await brandService.getProductsByBrand(1, { limit: 2, offset: 2 });
      
      // Assert
      expect(result.data.length).toBe(1); // Only one product left on this page
      expect(result.pagination).toEqual({
        total: 3,
        limit: 2,
        offset: 2,
        hasMore: false
      });
    });
    
    it('should throw an AppError when brand is not found', async () => {
      // Arrange
      mockBrandRepository.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(brandService.getProductsByBrand(999, {}))
        .rejects.toThrow(new AppError('Brand with ID 999 not found', 404));
    });
    
    it('should return empty data when brand exists but has no products', async () => {
      // Arrange
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue({
        ...mockBrands[0],
        products: []
      });
      
      // Act
      const result = await brandService.getProductsByBrand(1, {});
      
      // Assert
      expect(result.data).toEqual([]);
      expect(result.pagination).toEqual({
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      });
    });
    
    it('should return empty data when brand has null products', async () => {
      // Arrange
      mockBrandRepository.findById = jest.fn().mockResolvedValue(mockBrands[0]);
      mockBrandRepository.findByIdWithProducts = jest.fn().mockResolvedValue({
        ...mockBrands[0],
        products: null
      });
      
      // Act
      const result = await brandService.getProductsByBrand(1, {});
      
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