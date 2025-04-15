import { Prisma } from '@prisma/client';

/**
 * Represents an item in a shopping cart
 */
export interface CartItem {
  /** ID of the product */
  productId: number;
  /** Quantity of the product */
  quantity: number;
  /** Basic product information needed for cart display */
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
  /** Subtotal for this item (quantity * price) */
  subtotal: number;
}

/**
 * Represents a shopping cart
 */
export interface Cart {
  /** Unique identifier for the cart */
  id: string;
  /** Items in the cart */
  items: CartItem[];
  /** Total price of all items before tax */
  subtotal: number;
  /** Tax amount */
  tax: number;  
  /** Total price including tax */
  total: number;
  /** Total number of items in cart */
  itemCount: number;
}