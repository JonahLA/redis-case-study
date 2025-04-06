import { Prisma } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import prisma from '../lib/prisma';

// Define an interface for the inventory audit entry
export interface InventoryAuditEntry {
  productId: number;
  previousStock: number;
  newStock: number;
  adjustment: number;
  reason?: string;
}

// Define a type for the Prisma model
type InventoryAudit = Prisma.InventoryAuditGetPayload<{}>;

export class InventoryAuditRepository extends BaseRepository<InventoryAudit> {
  protected model = prisma.inventoryAudit;

  /**
   * Create a new audit entry for an inventory adjustment
   */
  async createAuditEntry(entry: InventoryAuditEntry): Promise<InventoryAudit> {
    return this.model.create({
      data: {
        productId: entry.productId,
        previousStock: entry.previousStock,
        newStock: entry.newStock,
        adjustment: entry.adjustment,
        reason: entry.reason || 'Not specified',
      }
    });
  }

  /**
   * Get audit history for a specific product
   */
  async getAuditHistoryByProduct(
    productId: number, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<InventoryAudit[]> {
    return this.model.findMany({
      where: {
        productId
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });
  }

  /**
   * Get recent inventory adjustments across all products
   */
  async getRecentAuditEntries(
    limit: number = 20, 
    offset: number = 0
  ): Promise<InventoryAudit[]> {
    return this.model.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        product: {
          select: {
            name: true
          }
        }
      }
    });
  }

  /**
   * Get audit entries within a date range
   */
  async getAuditEntriesByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<InventoryAudit[]> {
    return this.model.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });
  }
  
  /**
   * Get audit entries by reason
   */
  async getAuditEntriesByReason(
    reason: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<InventoryAudit[]> {
    return this.model.findMany({
      where: {
        reason: {
          contains: reason,
          mode: 'insensitive'
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });
  }
}
