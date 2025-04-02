import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import prisma from '../lib/prisma';

export class ProductRepository extends BaseRepository<Prisma.ProductGetPayload<{}>> {
  protected model = prisma.product;

  /**
   * Find products by category
   */
  async findByCategory(categoryId: number): Promise<Prisma.ProductGetPayload<{}>[]> {
    return this.model.findMany({
      where: { categoryId },
    });
  }

  /**
   * Find products by brand
   */
  async findByBrand(brandId: number): Promise<Prisma.ProductGetPayload<{}>[]> {
    return this.model.findMany({
      where: { brandId },
    });
  }

  /**
   * Find a product with brand and category information
   */
  async findByIdWithRelations(id: number): Promise<Prisma.ProductGetPayload<{
    include: { brand: true, category: true }
  }> | null> {
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
  async findRelatedProducts(productId: number, categoryId: number, limit: number = 4): Promise<Prisma.ProductGetPayload<{
    select: { id: true, name: true, price: true, imageUrl: true }
  }>[]> {
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
    });
  }

  /**
   * Update product stock (with pessimistic locking for consistency)
   */
  async updateStock(id: number, quantity: number): Promise<Prisma.ProductGetPayload<{}>> {
    return this.transaction(async (tx) => {
      // Get the current product with a lock
      const product = await tx.product.findUnique({
        where: { id },
        select: { id: true, stock: true },
      });

      if (!product) {
        throw new Error(`Product with ID ${id} not found`);
      }

      const newStock = product.stock + quantity;
      if (newStock < 0) {
        throw new Error(`Insufficient stock for product ${id}`);
      }

      // Update the stock
      return tx.product.update({
        where: { id },
        data: { stock: newStock },
      });
    });
  }
}
