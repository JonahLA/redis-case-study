// Mock the prisma client first, before any imports
jest.mock('../../../src/lib/prisma', () => {
  // Define a properly typed mock Prisma client
  const mockPrismaClient = {
    product: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
    category: {
      create: jest.fn().mockResolvedValue({}),
    },
    brand: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(mockPrismaClient)),
  };

  return {
    __esModule: true,
    default: mockPrismaClient,
    disconnectPrisma: jest.fn(),
    checkDatabaseConnection: jest.fn().mockResolvedValue(true),
  };
});

// Now import the dependencies
import { ProductRepository } from '../../../src/repositories/productRepository';
import prisma from '../../../src/lib/prisma';
import { Prisma } from '@prisma/client';

// Type assertion to help TypeScript understand our mocks
type MockedPrisma = {
  product: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  category: {
    create: jest.Mock;
  };
  brand: {
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

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

// Get the mocked prisma client with proper typing
const mockPrisma = prisma as unknown as MockedPrisma;

describe('ProductRepository', () => {
  let productRepository: ProductRepository;
  const categoryId = 1;
  const brandId = 1;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    productRepository = new ProductRepository();
  });

  it('should create a product', async () => {
    // Arrange
    const productData = {
      name: 'Test Product',
      description: 'Test Product Description',
      price: 99.99,
      stock: 10,
      categoryId,
      brandId,
    };
    
    const mockProduct = {
      id: 1,
      ...productData,
      price: createMockDecimal('99.99'),
      imageUrl: null, // Add missing field
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.product.create.mockResolvedValue(mockProduct);

    // Act
    const product = await productRepository.create(productData);

    // Assert
    expect(product).toBeDefined();
    expect(product.name).toBe('Test Product');
    expect(product.price.toString()).toBe('99.99');
    expect(product.stock).toBe(10);
    expect(mockPrisma.product.create).toHaveBeenCalledWith({
      data: productData
    });
  });

  it('should find a product by id', async () => {
    // Arrange
    const mockProduct = {
      id: 1,
      name: 'Find Me Product',
      description: 'Product to find by ID',
      price: createMockDecimal('59.99'),
      stock: 5,
      categoryId,
      brandId,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: null, // Add missing field
    };

    mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

    // Act
    const foundProduct = await productRepository.findById(1);
    
    // Assert
    expect(foundProduct).toBeDefined();
    expect(foundProduct?.id).toBe(1);
    expect(foundProduct?.name).toBe('Find Me Product');
    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });

  it('should find products by category', async () => {
    // Arrange
    const mockProducts = [
      {
        id: 2,
        name: 'Category Product 1',
        description: 'Product in test category',
        price: createMockDecimal('29.99'),
        stock: 15,
        categoryId,
        brandId,
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: null, // Add missing field
      },
      {
        id: 3,
        name: 'Category Product 2',
        description: 'Another product in test category',
        price: createMockDecimal('39.99'),
        stock: 20,
        categoryId,
        brandId,
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: null, // Add missing field
      }
    ];

    mockPrisma.product.findMany.mockResolvedValue(mockProducts);

    // Act
    const products = await productRepository.findByCategory(categoryId);
    
    // Assert
    expect(products).toBeDefined();
    expect(products.length).toBe(2);
    expect(products[0].name).toBe('Category Product 1');
    expect(products[1].name).toBe('Category Product 2');
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
      where: { categoryId }
    });
  });

  it('should update product stock', async () => {
    // Arrange
    const mockProduct = {
      id: 4,
      name: 'Stock Update Product',
      description: 'Product to test stock updates',
      price: createMockDecimal('49.99'),
      stock: 5, // Updated stock
      categoryId,
      brandId,
      createdAt: new Date(),
      updatedAt: new Date(),
      imageUrl: null, // Add missing field
    };

    // Mock the transaction flow
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 4,
      stock: 10, // Original stock
    });
    
    mockPrisma.product.update.mockResolvedValue(mockProduct);

    // Act
    const updatedProduct = await productRepository.updateStock(4, -5);
    
    // Assert
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct.stock).toBe(5);
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { stock: 5 }
    });
  });

  it('should throw an error when trying to reduce stock below zero', async () => {
    // Arrange
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 5,
      stock: 3,
    });

    // Act & Assert
    await expect(async () => {
      await productRepository.updateStock(5, -5);
    }).rejects.toThrow('Insufficient stock');
  });

  it('should find a product with brand and category information', async () => {
    // Arrange
    const mockProduct = {
      id: 1,
      name: 'StrikeMaster Pro X1',
      description: 'Tournament-grade ball',
      price: createMockDecimal('249.99'),
      stock: 20,
      imageUrl: 'https://example.com/products/x1.jpg',
      categoryId,
      brandId,
      createdAt: new Date(),
      updatedAt: new Date(),
      brand: {
        id: brandId,
        name: 'StrikeMaster',
        description: 'Premium bowling equipment',
        imageUrl: 'https://example.com/brands/strikemaster.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      category: {
        id: categoryId,
        name: 'Professional',
        description: 'Pro grade bowling balls',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

    // Act
    const product = await productRepository.findByIdWithRelations(1);

    // Assert
    expect(product).toBeDefined();
    expect(product?.id).toBe(1);
    expect(product?.name).toBe('StrikeMaster Pro X1');
    expect(product?.brand).toBeDefined();
    expect(product?.brand.name).toBe('StrikeMaster');
    expect(product?.category).toBeDefined();
    expect(product?.category.name).toBe('Professional');
    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        brand: true,
        category: true,
      }
    });
  });

  it('should find related products excluding current product', async () => {
    // Arrange
    const productId = 1;
    const mockRelatedProducts = [
      {
        id: 2,
        name: 'ThunderRoll Cyclone',
        price: createMockDecimal('229.99'),
        imageUrl: 'https://example.com/cyclone.jpg',
      },
      {
        id: 3,
        name: 'StrikeMaster Elite',
        price: createMockDecimal('279.99'),
        imageUrl: 'https://example.com/elite.jpg',
      }
    ];

    mockPrisma.product.findMany.mockResolvedValue(mockRelatedProducts);

    // Act
    const relatedProducts = await productRepository.findRelatedProducts(productId, categoryId, 2);

    // Assert
    expect(relatedProducts).toBeDefined();
    expect(relatedProducts.length).toBe(2);
    expect(relatedProducts[0].id).toBe(2);
    expect(relatedProducts[1].id).toBe(3);
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
      where: {
        categoryId,
        NOT: { id: productId }
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true
      },
      take: 2
    });
  });
});
