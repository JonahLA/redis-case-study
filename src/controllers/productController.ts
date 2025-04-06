import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const productService = new ProductService();

/**
 * GET /api/products
 * Get all products
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await productService.getAllProducts();
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/products/:productId
 * Get product detail by ID with relations and related products
 */
router.get('/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId);
    
    if (isNaN(productId)) {
      throw new AppError('Invalid product ID format', 400);
    }
    
    const product = await productService.getProductDetail(productId);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

export default router;
