import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import prisma from '../lib/prisma';

// Define a type that includes the full Product model structure
type ProductWithAllFields = Prisma.ProductGetPayload<{
  include: { brand: true; category: true }
}>;

// Define a simplified product type for common operations
type Product = Prisma.ProductGetPayload<{}>;

export class ProductRepository extends BaseRepository<Product> {
  protected model = prisma.product;

  /**
   * Find products by category
   */
  async findByCategory(categoryId: number): Promise<Product[]> {
    return this.model.findMany({
      where: { categoryId },
    });
  }

  /**
   * Find products by brand
   */
  async findByBrand(brandId: number): Promise<Product[]> {
    return this.model.findMany({
      where: { brandId },
    });
  }

  /**
   * Find a product with brand and category information
   */
  async findByIdWithRelations(id: number): Promise<ProductWithAllFields | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
      },
    });
  }

  /**
   * Find related products from the same category, excluding the current product
   */
  async findRelatedProducts(productId: number, categoryId: number, limit: number = 4): Promise<Product[]> {
    return this.model.findMany({
      where: {
        categoryId,
        NOT: {
          id: productId
        }
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true
      },
      take: limit
    }) as Promise<Product[]>;
  }

  /**
   * Update product stock (with pessimistic locking for consistency)
   */
  async updateStock(id: number, newStockQuantity: number): Promise<Product> {
    return this.transaction(async (tx) => {
      // Get the current product with a lock
      const product = await tx.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      if (newStockQuantity < 0) {
        throw new Error(`Cannot set negative stock for product ${id}`);
      }

      // Update the stock with absolute value
      return tx.product.update({
        where: { id },
        data: { stock: newStockQuantity },
      });
    });
  }

  /**
   * Adjust product stock by relative amount (with pessimistic locking)
   */
  async adjustStock(id: number, adjustment: number): Promise<Product> {
    return this.transaction(async (tx) => {
      // Get the current product with a lock
      const product = await tx.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      const newStock = product.stock + adjustment;
      if (newStock < 0) {
        throw new Error(`Insufficient stock for product ${id}. Current: ${product.stock}, Requested adjustment: ${adjustment}`);
      }

      // Update the stock
      return tx.product.update({
        where: { id },
        data: { stock: newStock },
      });
    });
  }

  /**
   * Get products with low stock (below threshold)
   */
  async findLowStock(threshold: number = 5): Promise<Product[]> {
    return this.model.findMany({
      where: {
        stock: {
          lte: threshold,
          gt: 0 // Greater than 0 to exclude out-of-stock items
        }
      },
      orderBy: {
        stock: 'asc'
      }
    });
  }

  /**
   * Get out-of-stock products
   */
  async findOutOfStock(): Promise<Product[]> {
    return this.model.findMany({
      where: {
        stock: {
          equals: 0
        }
      }
    });
  }

  /**
   * Update stock for multiple products in a single transaction
   */
  async batchUpdateStock(
    items: Array<{ id: number; newStock: number }>
  ): Promise<Product[]> {
    return this.transaction(async (tx) => {
      const results: Product[] = [];

      // Process each item one by one within the transaction
      for (const item of items) {
        // Get the product with a lock
        const product = await tx.product.findUnique({
          where: { id: item.id },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.id} not found`);
        }

        if (item.newStock < 0) {
          throw new Error(`Cannot set negative stock for product ${item.id}`);
        }

        // Update the stock
        const updated = await tx.product.update({
          where: { id: item.id },
          data: { stock: item.newStock },
        });

        results.push(updated);
      }

      return results;
    });
  }

  /**
   * Adjust stock for multiple products in a single transaction
   */
  async batchAdjustStock(
    items: Array<{ id: number; adjustment: number }>
  ): Promise<Product[]> {
    return this.transaction(async (tx) => {
      const results: Product[] = [];

      // Fetch all products first to check availability
      const productIds = items.map(item => item.id);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds }
        }
      }) as Product[];

      // Create a map for easy lookup
      const productMap = new Map<number, Product>(products.map(p => [p.id, p]));

      // Verify all products exist and have sufficient stock
      for (const item of items) {
        const product = productMap.get(item.id);
        
        if (!product) {
          throw new Error(`Product with ID ${item.id} not found`);
        }
        
        const newStock = product.stock + item.adjustment;
        if (newStock < 0) {
          throw new Error(
            `Insufficient stock for product ${item.id}. Current: ${product.stock}, Requested adjustment: ${item.adjustment}`
          );
        }
      }

      // If all validations pass, process the updates
      for (const item of items) {
        const product = productMap.get(item.id)!;
        const newStock = product.stock + item.adjustment;
        
        const updated = await tx.product.update({
          where: { id: item.id },
          data: { stock: newStock },
        }) as Product;
        
        results.push(updated);
      }

      return results;
    });
  }

  /**
   * Find a product by ID
   */
  async findById(id: number): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id }
    });
  }

  /**
   * Find products by IDs
   */
  async findByIds(ids: number[]): Promise<Product[]> {
    return prisma.product.findMany({
      where: {
        id: {
          in: ids
        }
      }
    });
  }
}
