import { Router, Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const inventoryService = new InventoryService();

/**
 * PATCH /api/inventory/:productId/adjust
 * Adjust inventory levels for a product
 */
router.patch('/:productId/adjust', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId);
    const { adjustment, reason } = req.body;
    
    if (isNaN(productId) || productId <= 0) {
      throw new AppError('Invalid product ID', 400);
    }
    
    if (adjustment === undefined || isNaN(adjustment)) {
      throw new AppError('Invalid adjustment value', 400);
    }
    
    const result = await inventoryService.adjustInventory(productId, adjustment, reason);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/:productId
 * Get current inventory for a product
 */
router.get('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId) || productId <= 0) {
      throw new AppError('Invalid product ID', 400);
    }
    
    const inventory = await inventoryService.getInventory(productId);
    res.status(200).json(inventory);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/:productId/audit
 * Get audit history for a product's inventory changes
 */
router.get('/:productId/audit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    if (isNaN(productId) || productId <= 0) {
      throw new AppError('Invalid product ID', 400);
    }
    
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      throw new AppError('Invalid limit parameter', 400);
    }
    
    if (isNaN(offset) || offset < 0) {
      throw new AppError('Invalid offset parameter', 400);
    }
    
    const auditHistory = await inventoryService.getInventoryAuditHistory(productId, limit, offset);
    res.status(200).json({ auditHistory });
  } catch (error) {
    next(error);
  }
});

export default router;
