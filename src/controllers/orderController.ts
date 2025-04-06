import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const orderService = new OrderService();

/**
 * POST /api/checkout
 * Create a new order from cart contents
 */
router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shippingAddress, paymentDetails } = req.body;
    const userId = req.headers['user-id'] as string; // Assuming user ID is passed in headers
    
    if (!shippingAddress || !paymentDetails) {
      throw new AppError('Shipping address and payment details are required', 400);
    }

    const order = await orderService.createOrder(userId, shippingAddress, paymentDetails);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders
 * Get all orders for the current user
 */
router.get('/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['user-id'] as string;
    const orders = await orderService.getOrdersByUser(userId);
    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/orders/:orderId
 * Get a specific order by ID
 */
router.get('/orders/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.headers['user-id'] as string;
    
    if (!orderId) {
      throw new AppError('Order ID is required', 400);
    }
    
    const order = await orderService.getOrderById(orderId, userId);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/orders/:orderId/complete
 * Simulate order completion (for testing purposes)
 */
router.patch('/orders/:orderId/complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.headers['user-id'] as string;
    
    if (!orderId) {
      throw new AppError('Order ID is required', 400);
    }
    
    const updatedOrder = await orderService.completeOrder(orderId, userId);
    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

export default router;
