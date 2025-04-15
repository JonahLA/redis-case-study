import { AppError } from '../middleware/errorMiddleware';
import { ProductRepository } from '../repositories/productRepository';
import { Prisma } from '@prisma/client';
import { Cart, CartItem } from '../types/cart';

export class CartService {
  private productRepository: ProductRepository;
  private TAX_RATE = 0.08; // 8% tax rate - in a real app this would be configurable
  
  // In-memory storage for carts
  private static cartsStorage = new Map<string, Cart>();

  constructor() {
    this.productRepository = new ProductRepository();
  }

  /**
   * Get cart contents
   */
  async getCart(cartId: string): Promise<Cart> {
    try {
      // Get cart from in-memory storage
      const cart = CartService.cartsStorage.get(cartId);

      if (!cart) {
        // Return empty cart if no cart exists
        return this.createEmptyCart(cartId);
      }

      return cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new AppError('Failed to fetch cart data', 500);
    }
  }

  /**
   * Add an item to the cart
   */
  async addItemToCart(cartId: string, productId: number, quantity: number): Promise<Cart> {
    try {
      // Validate product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }

      // Check product stock - assuming products have a stock field
      if (product.stock && product.stock < quantity) {
        throw new AppError(`Insufficient stock for product ${product.name}. Available: ${product.stock}`, 400);
      }

      // Get current cart
      const cart = await this.getCart(cartId);

      // Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
      
      // Convert Prisma Decimal to number
      const productPrice = this.convertDecimalToNumber(product.price);

      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        // Check stock for the combined quantity
        if (product.stock && product.stock < newQuantity) {
          throw new AppError(`Cannot add ${quantity} more of this product. Available stock: ${product.stock}`, 400);
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].subtotal = Number((productPrice * newQuantity).toFixed(2));
      } else {
        // Add new item
        cart.items.push({
          productId,
          quantity,
          product: {
            id: product.id,
            name: product.name,
            price: productPrice,
            imageUrl: product.imageUrl || '',
          },
          subtotal: Number((productPrice * quantity).toFixed(2))
        });
      }

      // Update cart totals
      return await this.updateCartTotals(cartId, cart);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error adding item to cart:', error);
      throw new AppError('Failed to add item to cart', 500);
    }
  }

  /**
   * Update item quantity in the cart
   */
  async updateCartItemQuantity(cartId: string, productId: number, quantity: number): Promise<Cart> {
    try {
      // Validate product exists
      const product = await this.productRepository.findById(productId);
      if (!product) {
        throw new AppError(`Product with ID ${productId} not found`, 404);
      }

      // Check product stock
      if (product.stock && product.stock < quantity) {
        throw new AppError(`Insufficient stock for product ${product.name}. Available: ${product.stock}`, 400);
      }

      // Get current cart
      const cart = await this.getCart(cartId);

      // Find the item in the cart
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

      if (existingItemIndex < 0) {
        throw new AppError(`Product with ID ${productId} not found in cart`, 404);
      }

      // Convert Prisma Decimal to number
      const productPrice = this.convertDecimalToNumber(product.price);

      // Update quantity
      cart.items[existingItemIndex].quantity = quantity;
      cart.items[existingItemIndex].subtotal = Number((productPrice * quantity).toFixed(2));

      // Update cart totals
      return await this.updateCartTotals(cartId, cart);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error updating cart item:', error);
      throw new AppError('Failed to update cart item', 500);
    }
  }

  /**
   * Remove an item from the cart
   */
  async removeItemFromCart(cartId: string, productId: number): Promise<Cart> {
    try {
      // Get current cart
      const cart = await this.getCart(cartId);

      // Find the item in the cart
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

      if (existingItemIndex < 0) {
        throw new AppError(`Product with ID ${productId} not found in cart`, 404);
      }

      // Remove the item
      cart.items.splice(existingItemIndex, 1);

      // Update cart totals
      return await this.updateCartTotals(cartId, cart);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error removing item from cart:', error);
      throw new AppError('Failed to remove item from cart', 500);
    }
  }

  /**
   * Clear the cart
   */
  async clearCart(cartId: string): Promise<Cart> {
    try {
      const emptyCart = this.createEmptyCart(cartId);
      // Store the empty cart in memory
      CartService.cartsStorage.set(cartId, emptyCart);
      return emptyCart;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new AppError('Failed to clear cart', 500);
    }
  }

  /**
   * Create an empty cart structure
   */
  private createEmptyCart(cartId: string): Cart {
    return {
      id: cartId,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      itemCount: 0
    };
  }

  /**
   * Update cart totals and save to storage
   */
  private async updateCartTotals(cartId: string, cart: Cart): Promise<Cart> {
    // Calculate subtotal
    cart.subtotal = Number(cart.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    
    // Calculate tax
    cart.tax = Number((cart.subtotal * this.TAX_RATE).toFixed(2));
    
    // Calculate total
    cart.total = Number((cart.subtotal + cart.tax).toFixed(2));
    
    // Calculate item count
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Save updated cart to in-memory storage
    CartService.cartsStorage.set(cartId, cart);
    
    return cart;
  }

  /**
   * Helper method to convert Prisma Decimal to JavaScript number
   */
  private convertDecimalToNumber(decimal: Prisma.Decimal | number): number {
    if (typeof decimal === 'number') {
      return decimal;
    }
    // Convert Prisma Decimal to string then to number
    return parseFloat(decimal.toString());
  }
}
