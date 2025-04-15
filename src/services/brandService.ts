import { Prisma } from '@prisma/client';
import { BrandRepository } from '../repositories/brandRepository';
import { AppError } from '../middleware/errorMiddleware';
import { PaginatedResponse, SortOptions } from '../types/common';

export class BrandService {
  private repository: BrandRepository;
  
  constructor() {
    this.repository = new BrandRepository();
  }

  /**
   * Get all brands
   */
  async getAllBrands(): Promise<Prisma.BrandGetPayload<{}>[]> {
    return this.repository.findAll();
  }

  /**
   * Get a brand by ID
   */
  async getBrandById(id: number): Promise<Prisma.BrandGetPayload<{}>> {
    const brand = await this.repository.findById(id);
    if (!brand) {
      throw new AppError(`Brand with ID ${id} not found`, 404);
    }
    return brand;
  }

  /**
   * Get products by brand with pagination and sorting
   */
  async getProductsByBrand(
    brandId: number,
    options: SortOptions & { limit?: number; offset?: number }
  ): Promise<PaginatedResponse<Prisma.ProductGetPayload<{}>>> {
    // Default pagination and sorting options
    const limit = options.limit || 10;
    const offset = options.offset || 0;
    const sort = options.sort || 'name';
    const order = options.order || 'asc';
    
    // Validate that brand exists
    const brand = await this.repository.findById(brandId);
    if (!brand) {
      throw new AppError(`Brand with ID ${brandId} not found`, 404);
    }

    // Get products with relations - explicitly type the result to include products
    const brandWithProducts = await this.repository.findByIdWithProducts(brandId) as Prisma.BrandGetPayload<{ include: { products: true } }>;
    
    // Check if brand exists and has products
    if (!brandWithProducts || !brandWithProducts.products || brandWithProducts.products.length === 0) {
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
    let products = [...brandWithProducts.products];
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
