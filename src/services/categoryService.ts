import { Prisma } from '@prisma/client';
import { CategoryRepository } from '../repositories/categoryRepository';
import { AppError } from '../middleware/errorMiddleware';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class CategoryService {
  private repository: CategoryRepository;
  
  constructor() {
    this.repository = new CategoryRepository();
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<Prisma.CategoryGetPayload<{}>[]> {
    return this.repository.findAll();
  }

  /**
   * Get a category by ID
   */
  async getCategoryById(id: number): Promise<Prisma.CategoryGetPayload<{}>> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new AppError(`Category with ID ${id} not found`, 404);
    }
    return category;
  }

  /**
   * Get products by category with pagination and sorting
   */
  async getProductsByCategory(
    categoryId: number,
    options: {
      limit?: number;
      offset?: number;
      sort?: string;
      order?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<Prisma.ProductGetPayload<{}>>> {
    // Default pagination and sorting options
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    const sort = options.sort || 'name';
    const order = options.order || 'asc';
    
    // Validate that category exists
    const category = await this.repository.findById(categoryId);
    if (!category) {
      throw new AppError(`Category with ID ${categoryId} not found`, 404);
    }

    // Get products with relations - explicitly type the result to include products
    const categoryWithProducts = await this.repository.findByIdWithProducts(categoryId) as Prisma.CategoryGetPayload<{ include: { products: true } }>;
    
    // Check if category exists and has products
    if (!categoryWithProducts || !categoryWithProducts.products || categoryWithProducts.products.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        }
      };
    }

    // Apply sorting
    let products = [...categoryWithProducts.products];
    products.sort((a, b) => {
      if (sort === 'price') {
        // Sort by price (numeric)
        const priceA = typeof a.price === 'number' ? a.price : Number(a.price);
        const priceB = typeof b.price === 'number' ? b.price : Number(b.price);
        return order === 'asc' ? priceA - priceB : priceB - priceA;
      } else {
        // Default sort by name (string)
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
    });

    // Apply pagination
    const total = products.length;
    products = products.slice(offset, offset + limit);

    return {
      data: products,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }
}
