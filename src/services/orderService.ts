import { OrderRepository } from '../repositories/orderRepository';
import { CartService } from './cartService';
import { ProductService } from './productService';
import { AppError } from '../middleware/errorMiddleware';

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface PaymentDetails {
  method: string;
  simulatePayment: boolean;
}

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  orderId: string;
  userId: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
}

export class OrderService {
  private repository: OrderRepository;
  private cartService: CartService;
  private productService: ProductService;
  
  constructor() {
    this.repository = new OrderRepository();
    this.cartService = new CartService();
    this.productService = new ProductService();
  }

  /**
   * Create a new order from user's cart
   */
  async createOrder(
    userId: string, 
    shippingAddress: ShippingAddress, 
    paymentDetails: PaymentDetails
  ): Promise<Order> {
    // Get user's cart
    const cart = await this.cartService.getCart(userId);
    
    // Verify cart is not empty
    if (!cart.items || cart.items.length === 0) {
      throw new AppError('Cannot checkout with an empty cart', 400);
    }
    
    // Verify all products are in stock
    const outOfStockItems = await this.checkStockAvailability(cart.items);
    if (outOfStockItems.length > 0) {
      throw new AppError(
        `The following items are out of stock: ${outOfStockItems.join(', ')}`,
        400
      );
    }
    
    // Calculate order totals
    const subtotal = cart.subtotal;
    const tax = subtotal * 0.08; // Assuming 8% tax rate
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;
    
    // Process payment (simulated)
    await this.processPayment(paymentDetails, total);
    
    // Create order in database
    const order = await this.repository.createOrder({
      userId,
      items: cart.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        subtotal: item.product.price * item.quantity
      })),
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    // Clear the cart after successful order
    await this.cartService.clearCart(userId);
    
    return order;
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
    
    // Update inventory (decrement stock for each product)
    await this.updateInventory(order.items);
    
    // Update order status to completed
    const updatedOrder = await this.repository.updateStatus(orderId, 'completed');
    
    return updatedOrder;
  }
  
  /**
   * Check if all products in cart are available in sufficient quantity
   */
  private async checkStockAvailability(items: any[]): Promise<string[]> {
    const outOfStockItems: string[] = [];
    
    for (const item of items) {
      const product = await this.productService.getProductById(item.product.id);
      if (product.stock < item.quantity) {
        outOfStockItems.push(product.name);
      }
    }
    
    return outOfStockItems;
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
  
  /**
   * Update inventory levels after order completion
   */
  private async updateInventory(items: OrderItem[]): Promise<void> {
    for (const item of items) {
      await this.productService.decrementStock(item.productId, item.quantity);
    }
  }
}
