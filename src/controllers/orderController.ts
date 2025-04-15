import { Router, Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();
const orderService = new OrderService();

/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Create new order
 *     description: Create a new order using the current cart contents and provided shipping/payment details
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: user-id
 *         in: header
 *         description: ID of the user creating the order
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentDetails
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - name
 *                   - street
 *                   - city
 *                   - state
 *                   - zipCode
 *                   - country
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Full name for shipping
 *                   street:
 *                     type: string
 *                     description: Street address
 *                   city:
 *                     type: string
 *                     description: City
 *                   state:
 *                     type: string
 *                     description: State/Province/Region
 *                   zipCode:
 *                     type: string
 *                     description: ZIP/Postal code
 *                   country:
 *                     type: string
 *                     description: Country
 *               paymentDetails:
 *                 type: object
 *                 description: Payment information (simulated for testing)
 *                 required:
 *                   - method
 *                   - status
 *                 properties:
 *                   method:
 *                     type: string
 *                     enum: [credit_card, debit_card, paypal]
 *                   status:
 *                     type: string
 *                     enum: [success]
 *     responses:
 *       201:
 *         description: Order successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid request (missing required fields or invalid data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cart not found or empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user orders
 *     description: Retrieve all orders for the current user
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: user-id
 *         in: header
 *         description: ID of the user whose orders to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve detailed information about a specific order
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: orderId
 *         in: path
 *         description: ID of the order to retrieve
 *         required: true
 *         schema:
 *           type: string
 *       - name: user-id
 *         in: header
 *         description: ID of the user requesting the order
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
 * @swagger
 * /api/orders/{orderId}/complete:
 *   patch:
 *     summary: Complete order
 *     description: |
 *       Simulate order completion for testing purposes.
 *       This endpoint would typically be called by a payment processing webhook in a production environment.
 *     tags:
 *       - Orders
 *     parameters:
 *       - name: orderId
 *         in: path
 *         description: ID of the order to complete
 *         required: true
 *         schema:
 *           type: string
 *       - name: user-id
 *         in: header
 *         description: ID of the user completing the order
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order successfully completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalError'
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
