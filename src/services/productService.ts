import { Prisma } from '@prisma/client';
import { ProductRepository } from '../repositories/productRepository';
import { AppError } from '../middleware/errorMiddleware';
import { PaginatedResponse } from './categoryService';

export interface ProductDetailResponse {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    description: string;
  };
  brand: {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
  };
  relatedProducts: {
    id: number;
    name: string;
    price: string;
    imageUrl: string | null;
  }[];
}

export class ProductService {
  private repository: ProductRepository;
  
  constructor() {
    this.repository = new ProductRepository();
  }

  /**
   * Get all products
   */
  async getAllProducts(): Promise<Prisma.ProductGetPayload<{}>[]> {
    return this.repository.findAll();
  }

  /**
   * Get a product by ID
   */
  async getProductById(id: number): Promise<Prisma.ProductGetPayload<{}>> {
    const product = await this.repository.findById(id);
    
    if (!product) {
      throw new AppError(`Product with ID ${id} not found`, 404);
    }
    
    return product;
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
    
    try {
      const products = await this.repository.findByCategory(categoryId);
      const total = products.length;
      
      // Apply sorting
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
      const paginatedProducts = products.slice(offset, offset + limit);
      
      return {
        data: paginatedProducts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total // This is correct - if we're at position 1 and limit is 2, 1+2 < 3 means there's more
        }
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`Error getting products for category ${categoryId}:`, error);
      throw new AppError('Failed to fetch products', 500);
    }
  }

  /**
   * Get products by brand with pagination and sorting
   */
  async getProductsByBrand(
    brandId: number,
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
    
    try {
      const products = await this.repository.findByBrand(brandId);
      const total = products.length;
      
      // Apply sorting
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
      const paginatedProducts = products.slice(offset, offset + limit);
      
      return {
        data: paginatedProducts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total // Using same logic as above
        }
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`Error getting products for brand ${brandId}:`, error);
      throw new AppError('Failed to fetch products', 500);
    }
  }

  /**
   * Get detailed product information including related products
   */
  async getProductDetail(id: number): Promise<ProductDetailResponse> {
    // Find the product with its relations
    const product = await this.repository.findByIdWithRelations(id);
    
    if (!product) {
      throw new AppError(`Product with ID ${id} not found`, 404);
    }

    // Find related products from the same category
    const relatedProducts = await this.repository.findRelatedProducts(id, product.categoryId);

    // Format the response according to the API contract
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      category: {
        id: product.category.id,
        name: product.category.name,
        description: product.category.description
      },
      brand: {
        id: product.brand.id,
        name: product.brand.name,
        description: product.brand.description,
        imageUrl: product.brand.imageUrl
      },
      relatedProducts: relatedProducts.map(related => ({
        id: related.id,
        name: related.name,
        price: related.price.toString(),
        imageUrl: related.imageUrl
      }))
    };
  }

  /**
   * Decrement product stock after order completion
   */
  async decrementStock(productId: number, quantity: number): Promise<void> {
    // Get the current product information
    const product = await this.getProductById(productId);
    
    // Verify sufficient stock is available
    if (product.stock < quantity) {
      throw new AppError(`Insufficient stock for product: ${product.name}`, 400);
    }
    
    try {
      // Update the stock
      const newStockLevel = product.stock - quantity;
      await this.repository.updateStock(productId, newStockLevel);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`Error updating stock for product ${productId}:`, error);
      throw new AppError('Failed to update product stock', 500);
    }
  }
}
