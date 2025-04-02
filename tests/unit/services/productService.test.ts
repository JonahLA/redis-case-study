// Mock the repository and redis
jest.mock('../../../src/repositories/productRepository', () => {
  return {
    ProductRepository: jest.fn().mockImplementation(() => ({
      findById: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      findByCategory: jest.fn().mockResolvedValue([]),
      findByBrand: jest.fn().mockResolvedValue([]),
      findByIdWithRelations: jest.fn().mockResolvedValue(null),
      findRelatedProducts: jest.fn().mockResolvedValue([]),
    }))
  };
});

jest.mock('../../../src/lib/redis', () => {
  return {
    __esModule: true,
    default: {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      setex: jest.fn().mockResolvedValue('OK'),
    },
    getOrSet: jest.fn().mockImplementation(async (key, fetchFn) => {
      return fetchFn();
    }),
  };
});

import { ProductService, ProductDetailResponse } from '../../../src/services/productService';
import { ProductRepository } from '../../../src/repositories/productRepository';
import { AppError } from '../../../src/middleware/errorMiddleware';
import { Prisma } from '@prisma/client';

// Create a more accurate mock for Decimal
const createMockDecimal = (value: string) => {
  return {
    toString: () => value,
    toNumber: () => parseFloat(value),
    // Add minimal necessary properties to satisfy TypeScript
    d: [1],
    e: 2,
    s: 1,
    constructor: { precision: 10 } as any,
    absoluteValue: jest.fn(),
    // ... other required methods
  } as unknown as Prisma.Decimal;
};

describe('ProductService', () => {
  let productService: ProductService;
  let mockRepository: jest.Mocked<ProductRepository>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new ProductRepository() as jest.Mocked<ProductRepository>;
    productService = new ProductService();
    // Set the private repository property manually
    (productService as any).repository = mockRepository;
  });

  it('should get all products', async () => {
    // Arrange
    const mockProducts = [
      {
        id: 1, 
        name: 'Test Product 1',
        description: 'Description 1',
        price: createMockDecimal('99.99'),
        stock: 10,
        imageUrl: null, // Add missing property
        categoryId: 1,
        brandId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2, 
        name: 'Test Product 2',
        description: 'Description 2',
        price: createMockDecimal('49.99'),
        stock: 20,
        imageUrl: 'https://example.com/product2.jpg', // Add missing property
        categoryId: 1,
        brandId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    mockRepository.findAll.mockResolvedValue(mockProducts);

    // Act
    const result = await productService.getAllProducts();

    // Assert
    expect(result).toBe(mockProducts);
    expect(mockRepository.findAll).toHaveBeenCalled();
  });

  it('should get product detail with related products', async () => {
    // Arrange
    const mockProduct = {
      id: 1,
      name: 'StrikeMaster Pro X1',
      description: 'Tournament-grade ball',
      price: createMockDecimal('249.99'),
      stock: 20,
      imageUrl: 'https://example.com/products/x1.jpg',
      categoryId: 1,
      brandId: 1,
      createdAt: new Date('2025-03-15'),
      updatedAt: new Date('2025-03-15'),
      brand: {
        id: 1,
        name: 'StrikeMaster',
        description: 'Premium bowling equipment',
        imageUrl: 'https://example.com/brands/strikemaster.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: {
        id: 1,
        name: 'Professional',
        description: 'Pro grade bowling balls',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    const mockRelatedProducts = [
      {
        id: 2,
        name: 'ThunderRoll Cyclone',
        price: createMockDecimal('229.99'),
        imageUrl: 'https://example.com/cyclone.jpg',
      }
    ];

    mockRepository.findByIdWithRelations.mockResolvedValue(mockProduct);
    mockRepository.findRelatedProducts.mockResolvedValue(mockRelatedProducts);

    // Act
    const result = await productService.getProductDetail(1);

    // Assert
    expect(result).toEqual({
      id: 1,
      name: 'StrikeMaster Pro X1',
      description: 'Tournament-grade ball',
      price: '249.99',
      stock: 20,
      imageUrl: 'https://example.com/products/x1.jpg',
      createdAt: new Date('2025-03-15').toISOString(),
      updatedAt: new Date('2025-03-15').toISOString(),
      category: {
        id: 1,
        name: 'Professional',
        description: 'Pro grade bowling balls',
      },
      brand: {
        id: 1,
        name: 'StrikeMaster',
        description: 'Premium bowling equipment',
        imageUrl: 'https://example.com/brands/strikemaster.jpg',
      },
      relatedProducts: [
        {
          id: 2,
          name: 'ThunderRoll Cyclone',
          price: '229.99',
          imageUrl: 'https://example.com/cyclone.jpg',
        }
      ]
    } as ProductDetailResponse);
    
    expect(mockRepository.findByIdWithRelations).toHaveBeenCalledWith(1);
    expect(mockRepository.findRelatedProducts).toHaveBeenCalledWith(1, 1); // productId, categoryId
  });

  it('should throw 404 error when product is not found', async () => {
    // Arrange
    mockRepository.findByIdWithRelations.mockResolvedValue(null);

    // Act & Assert
    await expect(productService.getProductDetail(999))
      .rejects
      .toThrow(new AppError('Product with ID 999 not found', 404));
  });
});
