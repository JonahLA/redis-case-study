import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import prisma from '../lib/prisma';

export class CategoryRepository extends BaseRepository<Prisma.CategoryGetPayload<{}>> {
  protected model = prisma.category;

  /**
   * Find a category with its products
   */
  async findByIdWithProducts(id: number): Promise<Prisma.CategoryGetPayload<{}> | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
  }

  /**
   * Find a category by name
   */
  async findByName(name: string): Promise<Prisma.CategoryGetPayload<{}> | null> {
    return this.model.findUnique({
      where: { name },
    });
  }
}
