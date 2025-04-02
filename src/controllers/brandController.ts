import { Router, Request, Response, NextFunction } from 'express';
import { BrandService } from '../services/brandService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const brandService = new BrandService();

/**
 * GET /api/brands
 * Get all brands
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
 * GET /api/brands/:brandId
 * Get a brand by ID
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
 * GET /api/brands/:brandId/products
 * Get products by brand with pagination and sorting
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
