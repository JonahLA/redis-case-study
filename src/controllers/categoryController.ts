import { Router, Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/categoryService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const categoryService = new CategoryService();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all available product categories
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json({ categories });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/categories/{categoryId}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve detailed information about a specific category
 *     tags:
 *       - Categories
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         description: ID of the category to retrieve
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    
    if (isNaN(categoryId)) {
      throw new AppError('Invalid category ID', 400);
    }
    
    const category = await categoryService.getCategoryById(categoryId);
    res.status(200).json({ category });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/categories/{categoryId}/products:
 *   get:
 *     summary: Get products by category
 *     description: Retrieve a paginated and sorted list of products within a specific category
 *     tags:
 *       - Categories
 *       - Products
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         description: ID of the category whose products to retrieve
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - $ref: '#/components/parameters/PaginationLimit'
 *       - $ref: '#/components/parameters/PaginationOffset'
 *       - $ref: '#/components/parameters/SortField'
 *       - $ref: '#/components/parameters/SortOrder'
 *     responses:
 *       200:
 *         description: List of products in the category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of products in the category
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 *                     offset:
 *                       type: integer
 *                       description: Number of items skipped
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more products to fetch
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:categoryId/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    
    if (isNaN(categoryId)) {
      throw new AppError('Invalid category ID', 400);
    }
    
    // Extract query parameters with defaults
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
    const sort = req.query.sort as string | undefined;
    const order = (req.query.order as 'asc' | 'desc' | undefined) || 'asc';
    
    // Validate numeric query parameters
    if ((limit !== undefined && isNaN(limit)) || limit !== undefined && limit <= 0) {
      throw new AppError('Invalid limit parameter', 400);
    }
    
    if ((offset !== undefined && isNaN(offset)) || offset !== undefined && offset < 0) {
      throw new AppError('Invalid offset parameter', 400);
    }
    
    // Validate sort parameter
    if (sort && !['name', 'price'].includes(sort)) {
      throw new AppError('Invalid sort parameter', 400);
    }
    
    // Validate order parameter
    if (order && !['asc', 'desc'].includes(order)) {
      throw new AppError('Invalid order parameter', 400);
    }
    
    const result = await categoryService.getProductsByCategory(categoryId, {
      limit,
      offset,
      sort,
      order: order as 'asc' | 'desc'
    });
    
    res.status(200).json({
      products: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

export default router;
