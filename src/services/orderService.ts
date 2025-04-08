import { OrderRepository } from '../repositories/orderRepository';
import { CartService } from './cartService';
import { InventoryService } from './inventoryService';
import { AppError } from '../middleware/errorMiddleware';
import { Order, ShippingAddress, PaymentDetails, OrderItem } from '../types/order';

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
    shippingAddress: ShippingAddress,
    paymentDetails: PaymentDetails
  ): Promise<Order> {
    try {
      // Get user's cart
      const cart = await this.cartService.getCart(userId);

      // Verify cart is not empty
      if (!cart.items || cart.items.length === 0) {
        throw new AppError('Cannot checkout with an empty cart', 400);
      }

      // Process payment (simulated)
      await this.processPayment(paymentDetails, cart.total);
      
      // Create order items from cart items
      const orderItems: OrderItem[] = cart.items.map(item => ({
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
      await this.inventoryService.adjustInventoryBatch(
        orderItems.map(item => ({
          productId: item.productId,
          quantity: -item.quantity,
          reason: `Order #${order.orderId}`
        }))
      );

      // Clear the cart
      await this.cartService.clearCart(userId);

      return order;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message.includes('stock')) {
          throw new AppError('Insufficient stock for one or more items', 400);
        }
      }
      throw new AppError('Failed to create order', 500);
    }
  }

  /**
   * Get all orders for a user
   */
  async getOrdersByUser(userId: string): Promise<Order[]> {
    return this.repository.findByUserId(userId);
  }
  
  /**
   * Get order details by ID
   */
  async getOrderById(orderId: string, userId: string): Promise<Order> {
    const order = await this.repository.findById(orderId);
    
    if (!order) {
      throw new AppError(`Order with ID ${orderId} not found`, 404);
    }
    
    // Security check - ensure user can only access their own orders
    if (order.userId !== userId) {
      throw new AppError('Unauthorized access to order', 403);
    }
    
    return order;
  }
  
  /**
   * Complete an order (for simulation purposes)
   */
  async completeOrder(orderId: string, userId: string): Promise<Order> {
    // Get the order and verify ownership
    const order = await this.getOrderById(orderId, userId);
    
    // Verify order is in pending status
    if (order.status !== 'pending') {
      throw new AppError(`Order is already ${order.status}`, 400);
    }
    
    // Update order status to completed
    const updatedOrder = await this.repository.updateStatus(orderId, 'completed');
    
    return updatedOrder;
  }
  
  /**
   * Simulate payment processing
   */
  private async processPayment(paymentDetails: PaymentDetails, amount: number): Promise<boolean> {
    // This is a simulation - in a real app, we'd integrate with a payment gateway
    if (!paymentDetails.simulatePayment) {
      // For testing purposes, if simulatePayment is false, we simulate a payment failure
      throw new AppError('Payment processing failed', 400);
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }
}
