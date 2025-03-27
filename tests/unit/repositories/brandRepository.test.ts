// Mock the prisma client first, before any imports
jest.mock('../../../src/lib/prisma', () => {
  // Define a properly typed mock Prisma client
  const mockPrismaClient = {
    brand: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
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
import { BrandRepository } from '../../../src/repositories/brandRepository';
import prisma from '../../../src/lib/prisma';

// Type assertion to help TypeScript understand our mocks
type MockedPrisma = {
  brand: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  $transaction: jest.Mock;
};

// Define types for our test data
type MockProduct = {
  id: number;
  name: string;
  description: string;
  price: { toString: () => string };
  stock: number;
  categoryId: number;
  brandId: number;
  createdAt: Date;
  updatedAt: Date;
};

type MockBrandWithProducts = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
  products: MockProduct[];
};  // Fixed the typo here (was "a1")

// Get the mocked prisma client with proper typing
const mockPrisma = prisma as unknown as MockedPrisma;

describe('BrandRepository', () => {
  let brandRepository: BrandRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    brandRepository = new BrandRepository();
  });

  it('should create a brand', async () => {
    // Arrange
    const brandData = {
      name: 'Test Brand',
      description: 'Test Brand Description',
      imageUrl: 'http://example.com/image.jpg',
    };
    
    const mockBrand = {
      id: 1,
      ...brandData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.brand.create.mockResolvedValue(mockBrand);

    // Act
    const brand = await brandRepository.create(brandData);

    // Assert
    expect(brand).toBeDefined();
    expect(brand.name).toBe('Test Brand');
    expect(brand.description).toBe('Test Brand Description');
    expect(brand.imageUrl).toBe('http://example.com/image.jpg');
    expect(mockPrisma.brand.create).toHaveBeenCalledWith({
      data: brandData
    });
  });

  it('should find a brand by id', async () => {
    // Arrange
    const mockBrand = {
      id: 1,
      name: 'Find Me Brand',
      description: 'Brand to find by ID',
      imageUrl: 'http://example.com/brand1.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.brand.findUnique.mockResolvedValue(mockBrand);

    // Act
    const foundBrand = await brandRepository.findById(1);
    
    // Assert
    expect(foundBrand).toBeDefined();
    expect(foundBrand?.id).toBe(1);
    expect(foundBrand?.name).toBe('Find Me Brand');
    expect(mockPrisma.brand.findUnique).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });

  it('should find a brand by name', async () => {
    // Arrange
    const mockBrand = {
      id: 2,
      name: 'Nike',
      description: 'Sports apparel and equipment',
      imageUrl: 'http://example.com/nike.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.brand.findUnique.mockResolvedValue(mockBrand);

    // Act
    const foundBrand = await brandRepository.findByName('Nike');
    
    // Assert
    expect(foundBrand).toBeDefined();
    expect(foundBrand?.id).toBe(2);
    expect(foundBrand?.name).toBe('Nike');
    expect(mockPrisma.brand.findUnique).toHaveBeenCalledWith({
      where: { name: 'Nike' }
    });
  });

  it('should find a brand with products', async () => {
    // Arrange
    const mockBrand: MockBrandWithProducts = {
      id: 3,
      name: 'Apple',
      description: 'Consumer electronics',
      imageUrl: 'http://example.com/apple.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      products: [
        {
          id: 1,
          name: 'iPhone',
          description: 'Smartphone',
          price: { toString: () => '999.99' },
          stock: 50,
          categoryId: 1,
          brandId: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]
    };

    mockPrisma.brand.findUnique.mockResolvedValue(mockBrand);

    // Act
    // Add type assertion to make TypeScript recognize the products property
    const brandWithProducts = await brandRepository.findByIdWithProducts(3) as MockBrandWithProducts;
    
    // Assert
    expect(brandWithProducts).toBeDefined();
    expect(brandWithProducts?.id).toBe(3);
    expect(brandWithProducts?.name).toBe('Apple');
    expect(brandWithProducts?.products).toHaveLength(1);
    expect(brandWithProducts?.products[0].name).toBe('iPhone');
    expect(mockPrisma.brand.findUnique).toHaveBeenCalledWith({
      where: { id: 3 },
      include: { products: true }
    });
  });
});
