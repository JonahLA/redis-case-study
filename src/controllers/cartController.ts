import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorMiddleware';
import { CartService } from '../services/cartService';

const router = Router();
const cartService = new CartService();

/**
 * GET /api/cart
 * View cart contents
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, we would get the cart ID from the user's session
    // For now, using a hardcoded or query param cart ID for testing
    const cartId = req.query.cartId as string || 'default-cart';
    
    const cart = await cartService.getCart(cartId);
    res.status(200).json(cart);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cart/items
 * Add a product to the cart
 */
router.post('/items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    // In a real application, we would get the cart ID from the user's session
    const cartId = req.query.cartId as string || 'default-cart';
    
    if (!productId || isNaN(productId) || productId <= 0) {
      throw new AppError('Invalid product ID', 400);
    }
    
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      throw new AppError('Invalid quantity', 400);
    }
    
    const updatedCart = await cartService.addItemToCart(cartId, parseInt(productId), parseInt(quantity));
    res.status(201).json(updatedCart);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/cart/items/:productId
 * Update item quantity in the cart
 */
router.patch('/items/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;
    // In a real application, we would get the cart ID from the user's session
    const cartId = req.query.cartId as string || 'default-cart';
    
    if (isNaN(productId) || productId <= 0) {
      throw new AppError('Invalid product ID', 400);
    }
    
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      throw new AppError('Invalid quantity', 400);
    }
    
    const updatedCart = await cartService.updateCartItemQuantity(cartId, productId, parseInt(quantity));
    res.status(200).json(updatedCart);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart/items/:productId
 * Remove an item from the cart
 */
router.delete('/items/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(req.params.productId);
    // In a real application, we would get the cart ID from the user's session
    const cartId = req.query.cartId as string || 'default-cart';
    
    if (isNaN(productId) || productId <= 0) {
      throw new AppError('Invalid product ID', 400);
    }
    
    const updatedCart = await cartService.removeItemFromCart(cartId, productId);
    res.status(200).json(updatedCart);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/cart
 * Clear the entire cart
 */
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real application, we would get the cart ID from the user's session
    const cartId = req.query.cartId as string || 'default-cart';
    
    const emptyCart = await cartService.clearCart(cartId);
    res.status(200).json(emptyCart);
  } catch (error) {
    next(error);
  }
});

export default router;
