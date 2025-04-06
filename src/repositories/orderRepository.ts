import { Prisma } from '@prisma/client';
import { BaseRepository } from './baseRepository';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderCreateInput {
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  status: string;
  createdAt: string;
}

export class OrderRepository extends BaseRepository<Prisma.OrderGetPayload<{}>> {
  protected model = prisma.order;

  /**
   * Create a new order with order items
   */
  async createOrder(data: OrderCreateInput): Promise<any> {
    // Generate a unique order ID (uuid)
    const orderId = uuidv4();
    
    return this.transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          id: orderId,
          userId: data.userId,
          status: data.status,
          subtotal: data.subtotal,
          tax: data.tax,
          shipping: data.shipping,
          total: data.total,
          shippingName: data.shippingAddress.name,
          shippingStreet: data.shippingAddress.street,
          shippingCity: data.shippingAddress.city,
          shippingState: data.shippingAddress.state,
          shippingZip: data.shippingAddress.zipCode,
          shippingCountry: data.shippingAddress.country,
          // Create all order items in a single transaction
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal
            }))
          }
        },
        // Include the items in the response
        include: {
          items: true
        }
      });
      
      // Format and return the response according to the API contract
      return {
        orderId: order.id,
        userId: order.userId,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.total,
        shippingAddress: {
          name: order.shippingName,
          street: order.shippingStreet,
          city: order.shippingCity,
          state: order.shippingState,
          zipCode: order.shippingZip,
          country: order.shippingCountry
        }
      };
    });
  }

  /**
   * Find an order by ID with its items
   */
  async findById(id: string): Promise<any> {
    const order = await this.model.findUnique({
      where: { id },
      include: {
        items: true
      }
    });
    
    if (!order) {
      return null;
    }
    
    // Format and return the response according to the API contract
    return {
      orderId: order.id,
      userId: order.userId,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      shippingAddress: {
        name: order.shippingName,
        street: order.shippingStreet,
        city: order.shippingCity,
        state: order.shippingState,
        zipCode: order.shippingZip,
        country: order.shippingCountry
      }
    };
  }

  /**
   * Find all orders for a specific user
   */
  async findByUserId(userId: string): Promise<any[]> {
    const orders = await this.model.findMany({
      where: { userId },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format and return the response according to the API contract
    return orders.map(order => ({
      orderId: order.id,
      userId: order.userId,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      shippingAddress: {
        name: order.shippingName,
        street: order.shippingStreet,
        city: order.shippingCity,
        state: order.shippingState,
        zipCode: order.shippingZip,
        country: order.shippingCountry
      }
    }));
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: string): Promise<any> {
    const updatedOrder = await this.model.update({
      where: { id },
      data: { status },
      include: {
        items: true
      }
    });
    
    // Format and return the response according to the API contract
    return {
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      status: updatedOrder.status,
      createdAt: updatedOrder.createdAt.toISOString(),
      items: updatedOrder.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      subtotal: updatedOrder.subtotal,
      tax: updatedOrder.tax,
      shipping: updatedOrder.shipping,
      total: updatedOrder.total,
      shippingAddress: {
        name: updatedOrder.shippingName,
        street: updatedOrder.shippingStreet,
        city: updatedOrder.shippingCity,
        state: updatedOrder.shippingState,
        zipCode: updatedOrder.shippingZip,
        country: updatedOrder.shippingCountry
      }
    };
  }
}
