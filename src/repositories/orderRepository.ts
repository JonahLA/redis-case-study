import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from './baseRepository';
import prisma from '../lib/prisma';

// Define types for the Prisma model with included relations
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { 
    items: {
      include: {
        product: true
      }
    }
  }
}>;

// Define base type for the Prisma model
type OrderModel = Prisma.OrderGetPayload<{}>;

// Define type for shipping address data
type ShippingAddressData = {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

// Define type for order creation data
type OrderCreateData = {
  userId: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddressData;
};

export class OrderRepository extends BaseRepository<OrderModel, string> {
  protected model = prisma.order;

  /**
   * Create a new order with items and shipping details
   */
  async createOrder(orderData: OrderCreateData): Promise<OrderWithRelations> {
    return this.transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          id: uuidv4(),
          userId: orderData.userId,
          status: 'pending',
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          shipping: orderData.shipping,
          total: orderData.total,
          shippingName: orderData.shippingAddress.name,
          shippingStreet: orderData.shippingAddress.street,
          shippingCity: orderData.shippingAddress.city,
          shippingState: orderData.shippingAddress.state,
          shippingZip: orderData.shippingAddress.zipCode,
          shippingCountry: orderData.shippingAddress.country,
          items: {
            create: orderData.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return order;
    });
  }

  /**
   * Find orders for a specific user
   */
  async findByUserId(userId: string): Promise<OrderWithRelations[]> {
    return this.model.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Override findById to include relations
   */
  async findById(orderId: string): Promise<OrderWithRelations | null> {
    return this.model.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: string): Promise<OrderWithRelations> {
    return this.model.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }
}
