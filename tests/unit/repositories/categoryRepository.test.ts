// Mock the prisma client first, before any imports
jest.mock('../../../src/lib/prisma', () => {
  // Define a properly typed mock Prisma client
  const mockPrismaClient = {
    category: {
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
import { CategoryRepository } from '../../../src/repositories/categoryRepository';
import prisma from '../../../src/lib/prisma';

// Type assertion to help TypeScript understand our mocks
type MockedPrisma = {
  category: {
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

type MockCategoryWithProducts = {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  products: MockProduct[];
};

// Get the mocked prisma client with proper typing
const mockPrisma = prisma as unknown as MockedPrisma;

describe('CategoryRepository', () => {
  let categoryRepository: CategoryRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    categoryRepository = new CategoryRepository();
  });

  it('should create a category', async () => {
    // Arrange
    const categoryData = {
      name: 'Test Category',
      description: 'Test Category Description',
    };
    
    const mockCategory = {
      id: 1,
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.category.create.mockResolvedValue(mockCategory);

    // Act
    const category = await categoryRepository.create(categoryData);

    // Assert
    expect(category).toBeDefined();
    expect(category.name).toBe('Test Category');
    expect(category.description).toBe('Test Category Description');
    expect(mockPrisma.category.create).toHaveBeenCalledWith({
      data: categoryData
    });
  });

  it('should find a category by id', async () => {
    // Arrange
    const mockCategory = {
      id: 1,
      name: 'Find Me Category',
      description: 'Category to find by ID',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

    // Act
    const foundCategory = await categoryRepository.findById(1);
    
    // Assert
    expect(foundCategory).toBeDefined();
    expect(foundCategory?.id).toBe(1);
    expect(foundCategory?.name).toBe('Find Me Category');
    expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
      where: { id: 1 }
    });
  });

  it('should find a category by name', async () => {
    // Arrange
    const mockCategory = {
      id: 2,
      name: 'Electronics',
      description: 'Electronic devices and gadgets',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

    // Act
    const foundCategory = await categoryRepository.findByName('Electronics');
    
    // Assert
    expect(foundCategory).toBeDefined();
    expect(foundCategory?.id).toBe(2);
    expect(foundCategory?.name).toBe('Electronics');
    expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
      where: { name: 'Electronics' }
    });
  });

  it('should find a category with products', async () => {
    // Arrange
    const mockCategory: MockCategoryWithProducts = {
      id: 3,
      name: 'Clothing',
      description: 'Clothing and accessories',
      createdAt: new Date(),
      updatedAt: new Date(),
      products: [
        {
          id: 1,
          name: 'T-Shirt',
          description: 'Cotton T-Shirt',
          price: { toString: () => '19.99' },
          stock: 100,
          categoryId: 3,
          brandId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]
    };

    mockPrisma.category.findUnique.mockResolvedValue(mockCategory);

    // Act
    // Add type assertion to make TypeScript recognize the products property
    const categoryWithProducts = await categoryRepository.findByIdWithProducts(3) as MockCategoryWithProducts;
    
    // Assert
    expect(categoryWithProducts).toBeDefined();
    expect(categoryWithProducts?.id).toBe(3);
    expect(categoryWithProducts?.name).toBe('Clothing');
    expect(categoryWithProducts?.products).toHaveLength(1);
    expect(categoryWithProducts?.products[0].name).toBe('T-Shirt');
    expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
      where: { id: 3 },
      include: { products: true }
    });
  });
});
