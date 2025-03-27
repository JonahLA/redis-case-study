import { PrismaClient, Prisma } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import prisma from '../lib/prisma';

export class BrandRepository extends BaseRepository<Prisma.BrandGetPayload<{}>> {
  protected model = prisma.brand;

  /**
   * Find a brand with its products
   */
  async findByIdWithProducts(id: number): Promise<Prisma.BrandGetPayload<{}> | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
  }

  /**
   * Find a brand by name
   */
  async findByName(name: string): Promise<Prisma.BrandGetPayload<{}> | null> {
    return this.model.findUnique({
      where: { name },
    });
  }
}
