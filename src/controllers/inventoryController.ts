import { Router, Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventoryService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const inventoryService = new InventoryService();

/**
 * @swagger
 * /api/inventory/{productId}/adjust:
 *   patch:
 *     summary: Adjust product inventory
 *     description: Adjust the inventory level for a specific product (increase or decrease)
 *     tags:
 *       - Inventory
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: ID of the product to adjust inventory for
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adjustment
 *             properties:
 *               adjustment:
 *                 type: integer
 *                 description: Amount to adjust inventory by (positive for increase, negative for decrease)
 *               reason:
 *                 type: string
 *                 description: Reason for the inventory adjustment
 *                 example: "Restocking"
 *     responses:
 *       200:
 *         description: Inventory successfully adjusted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: integer
 *                   description: ID of the product
 *                 previousStock:
 *                   type: integer
 *                   description: Stock level before adjustment
 *                 newStock:
 *                   type: integer
 *                   description: Stock level after adjustment
 *                 adjustment:
 *                   type: integer
 *                   description: Amount adjusted
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: When the adjustment was made
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
    
    const result = await inventoryService.batchAdjustStock([{
      productId,
      quantity: adjustment,
      reason
    }]);
    res.status(200).json(result[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/inventory/{productId}:
 *   get:
 *     summary: Get product inventory
 *     description: Get the current inventory level for a specific product
 *     tags:
 *       - Inventory
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: ID of the product to get inventory for
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Current inventory information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 productId:
 *                   type: integer
 *                   description: ID of the product
 *                 stock:
 *                   type: integer
 *                   description: Current stock level
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: When the inventory was last updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId) || productId <= 0) {
      throw new AppError('Invalid product ID', 400);
    }
    
    const inventory = await inventoryService.getInventoryStatus(productId);
    res.status(200).json(inventory);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/inventory/{productId}/audit:
 *   get:
 *     summary: Get inventory audit history
 *     description: Retrieve the audit history of inventory changes for a specific product
 *     tags:
 *       - Inventory
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: ID of the product to get audit history for
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: limit
 *         in: query
 *         description: Maximum number of audit records to return
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - name: offset
 *         in: query
 *         description: Number of audit records to skip
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: List of inventory audit records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 auditHistory:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryAudit'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
    
    const auditHistory = await inventoryService.getInventoryAuditHistory(productId);
    res.status(200).json({ auditHistory });
  } catch (error) {
    next(error);
  }
});

export default router;
