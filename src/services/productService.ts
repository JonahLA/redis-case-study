import { Prisma } from '@prisma/client';
import { ProductRepository } from '../repositories/productRepository';
import redis, { getOrSet } from '../lib/redis';
import { AppError } from '../middleware/errorMiddleware';

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
  private DEFAULT_CACHE_TTL = 3600; // 1 hour in seconds
  
  constructor() {
    this.repository = new ProductRepository();
  }

  /**
   * Get a product by ID, with caching
   */
  async getProductById(id: number): Promise<Prisma.ProductGetPayload<{}> | null> {
    const cacheKey = `product:${id}`;
    
    try {
      // Use getOrSet utility to handle cache miss/hit logic
      const productJson = await getOrSet(
        cacheKey,
        async () => {
          const product = await this.repository.findById(id);
          if (!product) return ''; // Empty string for null values
          return JSON.stringify(product);
        },
        this.DEFAULT_CACHE_TTL
      );
      
      // If empty string, it means product was not found
      if (!productJson) return null;
      
      return JSON.parse(productJson);
    } catch (error) {
      console.error(`Error getting product ${id} with cache:`, error);
      // Fallback to database on cache error
      return this.repository.findById(id);
    }
  }

  /**
   * Get a product with relations (brand and category), with caching
   */
  async getProductWithRelations(id: number): Promise<Prisma.ProductGetPayload<{
    include: { brand: true, category: true }
  }> | null> {
    const cacheKey = `product:${id}:with_relations`;
    
    try {
      // Use getOrSet utility to handle cache miss/hit logic
      const productJson = await getOrSet(
        cacheKey,
        async () => {
          const product = await this.repository.findByIdWithRelations(id);
          if (!product) return ''; // Empty string for null values
          return JSON.stringify(product);
        },
        this.DEFAULT_CACHE_TTL
      );
      
      // If empty string, it means product was not found
      if (!productJson) return null;
      
      return JSON.parse(productJson);
    } catch (error) {
      console.error(`Error getting product ${id} with relations and cache:`, error);
      // Fallback to database on cache error
      return this.repository.findByIdWithRelations(id);
    }
  }

  /**
   * Get products by category, with caching
   */
  async getProductsByCategory(categoryId: number): Promise<Prisma.ProductGetPayload<{}>[]> {
    const cacheKey = `products:category:${categoryId}`;
    
    try {
      // Use getOrSet utility to handle cache miss/hit logic
      const productsJson = await getOrSet(
        cacheKey,
        async () => {
          const products = await this.repository.findByCategory(categoryId);
          return JSON.stringify(products);
        },
        this.DEFAULT_CACHE_TTL
      );
      
      return JSON.parse(productsJson);
    } catch (error) {
      console.error(`Error getting products for category ${categoryId} with cache:`, error);
      // Fallback to database on cache error
      return this.repository.findByCategory(categoryId);
    }
  }

  /**
   * Clear product cache after updates
   */
  async invalidateProductCache(id: number): Promise<void> {
    const keys = [
      `product:${id}`,
      `product:${id}:with_relations`
    ];
    
    try {
      await redis.del(...keys);
      
      // Also try to invalidate any category cache this product might be in
      const product = await this.repository.findById(id);
      if (product) {
        await redis.del(`products:category:${product.categoryId}`);
      }
    } catch (error) {
      console.error(`Error invalidating cache for product ${id}:`, error);
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
   * Get all products
   */
  async getAllProducts(): Promise<Prisma.ProductGetPayload<{}>[]> {
    return this.repository.findAll();
  }
}
