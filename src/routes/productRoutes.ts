import { Router } from 'express';
import { ProductController } from '../controllers/productController';

const router = Router();
const productController = new ProductController();

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID with details
router.get('/:id', productController.getProductById);

export default router;
