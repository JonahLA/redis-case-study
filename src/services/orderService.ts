import { OrderRepository } from '../repositories/orderRepository';
import { CartService } from './cartService';
import { InventoryService } from './inventoryService';
import { AppError } from '../middleware/errorMiddleware';
import { Prisma } from '@prisma/client';
import { PaymentDetails } from '../types/order';

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { 
    items: {
      include: {
        product: true
      }
    }
  }
}>;

export class OrderService {
  private repository: OrderRepository;
  private cartService: CartService;
  private inventoryService: InventoryService;

  constructor() {
    this.repository = new OrderRepository();
    this.cartService = new CartService();
    this.inventoryService = new InventoryService();
  }

  async createOrder(
    userId: string,
    shippingAddress: {
      name: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    },
    paymentDetails: PaymentDetails
  ): Promise<OrderWithRelations> {
    try {
      // Get user's cart
      let cart;
      try {
        cart = await this.cartService.getCart(userId);
      } catch (error) {
        throw new AppError('Failed to retrieve cart', 500);
      }

      // Verify cart is not empty
      if (!cart.items || cart.items.length === 0) {
        throw new AppError('Cannot checkout with an empty cart', 400);
      }

      // Process payment (simulated)
      await this.processPayment(paymentDetails, cart.total);
      
      // Create order items from cart items
      const orderItems = cart.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.subtotal
      }));

      // Create the order
      const order = await this.repository.createOrder({
        userId,
        items: orderItems,
        subtotal: cart.subtotal,
        tax: cart.tax,
        shipping: cart.total - cart.subtotal - cart.tax,
        total: cart.total,
        shippingAddress
      });

      // Update inventory
      try {
        await this.inventoryService.batchAdjustStock(
          orderItems.map(item => ({
            productId: item.productId,
            quantity: -item.quantity,
            reason: `Order #${order.id}`
          }))
        );
      } catch (error) {
        throw new AppError('Failed to adjust inventory', 500);
      }

      // Clear the cart
      await this.cartService.clearCart(userId);

      return order;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create order', 500);
    }
  }

  /**
   * Get all orders for a user
   */
  async getOrdersByUser(userId: string): Promise<OrderWithRelations[]> {
    try {
      return await this.repository.findByUserId(userId);
    } catch (error) {
      throw new AppError('Failed to retrieve orders', 500);
    }
  }
  
  /**
   * Get order details by ID
   */
  async getOrderById(orderId: string, userId: string, action: 'view' | 'update' = 'view'): Promise<OrderWithRelations> {
    try {
      const order = await this.repository.findById(orderId);
      
      if (!order) {
        throw new AppError('Order not found', 404);
      }
      
      // Security check - ensure user can only access their own orders
      if (order.userId !== userId) {
        throw new AppError(`Not authorized to ${action} this order`, 403);
      }
      
      return order;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve order', 500);
    }
  }

  /**
   * Complete an order (for simulation purposes)
   */
  async completeOrder(orderId: string, userId: string): Promise<OrderWithRelations> {
    try {
      const order = await this.getOrderById(orderId, userId, 'update');
      
      // Verify order is in pending status
      if (order.status === 'completed') {
        throw new AppError('Order is already completed', 400);
      }
      
      // Update order status to completed
      return await this.repository.updateStatus(orderId, 'completed');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update order status', 500);
    }
  }

  /**
   * Simulate payment processing
   */
  private async processPayment(paymentDetails: PaymentDetails, amount: number): Promise<boolean> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
}
