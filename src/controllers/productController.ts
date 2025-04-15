import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const productService = new ProductService();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of all products in the catalog
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /api/products/{productId}:
 *   get:
 *     summary: Get product details by ID
 *     description: Retrieve detailed information about a specific product, including its category, brand, and related products
 *     tags:
 *       - Products
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: ID of the product to retrieve
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Detailed product information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The product ID
 *                 name:
 *                   type: string
 *                   description: Product name
 *                 description:
 *                   type: string
 *                   description: Product description
 *                 price:
 *                   type: string
 *                   description: Product price in decimal format
 *                 stock:
 *                   type: integer
 *                   description: Current stock level
 *                 imageUrl:
 *                   type: string
 *                   nullable: true
 *                   description: URL to product image
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Creation timestamp
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Last update timestamp
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *                 brand:
 *                   $ref: '#/components/schemas/Brand'
 *                 relatedProducts:
 *                   type: array
 *                   description: Related products from the same category
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       price:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
