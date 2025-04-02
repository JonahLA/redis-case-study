import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorMiddleware';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Get all products
   */
  getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const products = await this.productService.getAllProducts();
      res.status(200).json({ products });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product detail by ID with relations and related products
   */
  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        throw new AppError('Invalid product ID format', 400);
      }
      
      const product = await this.productService.getProductDetail(productId);
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  };
}
