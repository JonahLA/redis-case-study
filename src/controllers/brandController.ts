import { Router, Request, Response, NextFunction } from 'express';
import { BrandService } from '../services/brandService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const brandService = new BrandService();

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Get all brands
 *     description: Retrieve a list of all available product brands
 *     tags:
 *       - Brands
 *     responses:
 *       200:
 *         description: List of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 brands:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Brand'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await brandService.getAllBrands();
    res.status(200).json({ brands });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/brands/{brandId}:
 *   get:
 *     summary: Get brand by ID
 *     description: Retrieve detailed information about a specific brand
 *     tags:
 *       - Brands
 *     parameters:
 *       - name: brandId
 *         in: path
 *         description: ID of the brand to retrieve
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Brand details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 brand:
 *                   $ref: '#/components/schemas/Brand'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/:brandId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = parseInt(req.params.brandId);
    
    if (isNaN(brandId)) {
      throw new AppError('Invalid brand ID', 400);
    }
    
    const brand = await brandService.getBrandById(brandId);
    res.status(200).json({ brand });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/brands/{brandId}/products:
 *   get:
 *     summary: Get products by brand
 *     description: Retrieve a paginated and sorted list of products from a specific brand
 *     tags:
 *       - Brands
 *       - Products
 *     parameters:
 *       - name: brandId
 *         in: path
 *         description: ID of the brand whose products to retrieve
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
 *         description: List of products from the brand
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
 *                       description: Total number of products for this brand
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
router.get('/:brandId/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = parseInt(req.params.brandId);
    
    if (isNaN(brandId)) {
      throw new AppError('Invalid brand ID', 400);
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
    
    const result = await brandService.getProductsByBrand(brandId, {
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
