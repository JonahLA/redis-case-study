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
      price: { toString: () => '99.99' } as any,
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
      price: { toString: () => '59.99' } as any,
      stock: 5,
      categoryId,
      brandId,
      createdAt: new Date(),
      updatedAt: new Date(),
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
        price: { toString: () => '29.99' } as any,
        stock: 15,
        categoryId,
        brandId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: 'Category Product 2',
        description: 'Another product in test category',
        price: { toString: () => '39.99' } as any,
        stock: 20,
        categoryId,
        brandId,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      price: { toString: () => '49.99' } as any,
      stock: 5, // Updated stock
      categoryId,
      brandId,
      createdAt: new Date(),
      updatedAt: new Date(),
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
});
