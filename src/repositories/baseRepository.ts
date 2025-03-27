import prisma from '../lib/prisma';

export abstract class BaseRepository<T> {
  protected abstract model: any;

  /**
   * Find a record by its ID
   */
  async findById(id: number): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    }) as Promise<T | null>;
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    return this.model.findMany() as Promise<T[]>;
  }

  /**
   * Create a new record
   */
  async create(data: any): Promise<T> {
    return this.model.create({
      data,
    }) as Promise<T>;
  }

  /**
   * Update a record
   */
  async update(id: number, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    }) as Promise<T>;
  }

  /**
   * Delete a record
   */
  async delete(id: number): Promise<T> {
    return this.model.delete({
      where: { id },
    }) as Promise<T>;
  }

  /**
   * Run operations in a transaction
   */
  async transaction<R>(fn: (tx: any) => Promise<R>): Promise<R> {
    return prisma.$transaction(fn);
  }

  /**
   * Count records
   */
  async count(where = {}): Promise<number> {
    return this.model.count({ where }) as Promise<number>;
  }
}
