import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorMiddleware';
import { CartService } from '../services/cartService';

const router = Router();
const cartService = new CartService();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get cart contents
 *     description: Retrieve the current contents of the shopping cart
 *     tags:
 *       - Cart
 *     parameters:
 *       - name: cartId
 *         in: query
 *         description: Unique identifier for the cart (temporary implementation)
 *         required: false
 *         schema:
 *           type: string
 *           default: default-cart
 *     responses:
 *       200:
 *         description: Cart contents successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add item to cart
 *     description: Add a product to the shopping cart with specified quantity
 *     tags:
 *       - Cart
 *     parameters:
 *       - name: cartId
 *         in: query
 *         description: Unique identifier for the cart (temporary implementation)
 *         required: false
 *         schema:
 *           type: string
 *           default: default-cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: ID of the product to add
 *                 minimum: 1
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the product to add
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Item successfully added to cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
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
 * @swagger
 * /api/cart/items/{productId}:
 *   patch:
 *     summary: Update cart item quantity
 *     description: Update the quantity of a specific product in the cart
 *     tags:
 *       - Cart
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: ID of the product to update
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: cartId
 *         in: query
 *         description: Unique identifier for the cart (temporary implementation)
 *         required: false
 *         schema:
 *           type: string
 *           default: default-cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: New quantity for the product
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Item quantity successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Product not found in cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /api/cart/items/{productId}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Remove a specific product from the shopping cart
 *     tags:
 *       - Cart
 *     parameters:
 *       - name: productId
 *         in: path
 *         description: ID of the product to remove
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: cartId
 *         in: query
 *         description: Unique identifier for the cart (temporary implementation)
 *         required: false
 *         schema:
 *           type: string
 *           default: default-cart
 *     responses:
 *       200:
 *         description: Item successfully removed from cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Product not found in cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear cart
 *     description: Remove all items from the shopping cart
 *     tags:
 *       - Cart
 *     parameters:
 *       - name: cartId
 *         in: query
 *         description: Unique identifier for the cart (temporary implementation)
 *         required: false
 *         schema:
 *           type: string
 *           default: default-cart
 *     responses:
 *       200:
 *         description: Cart successfully cleared
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
