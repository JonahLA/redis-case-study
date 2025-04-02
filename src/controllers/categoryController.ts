import { Router, Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/categoryService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const categoryService = new CategoryService();

/**
 * GET /api/categories
 * Get all categories
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
 * GET /api/categories/:categoryId
 * Get a category by ID
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
 * GET /api/categories/:categoryId/products
 * Get products by category with pagination and sorting
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
