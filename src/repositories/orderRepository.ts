import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { Order, OrderItem } from '../types/order';

// Define types for the Prisma model
type OrderWithItems = Prisma.OrderGetPayload<{
  include: { 
    items: {
      include: {
        product: true
      }
    }
  }
}>;

type OrderModel = Prisma.OrderGetPayload<{}>;

// Create a base repository for string IDs
abstract class StringIdRepository<T> {
  protected abstract model: any;

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    }) as Promise<T | null>;
  }

  async findAll(): Promise<T[]> {
    return this.model.findMany() as Promise<T[]>;
  }

  async create(data: any): Promise<T> {
    return this.model.create({
      data,
    }) as Promise<T>;
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    }) as Promise<T>;
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    }) as Promise<T>;
  }

  async transaction<R>(fn: (tx: any) => Promise<R>): Promise<R> {
    return prisma.$transaction(fn);
  }
}

export class OrderRepository extends StringIdRepository<OrderModel> {
  protected model = prisma.order;

  async createOrder(orderData: {
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
  }): Promise<Order> {
    try {
      const order = await this.model.create({
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
      }) as OrderWithItems;

      return this.mapToOrder(order);
    } catch (error) {
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Order[]> {
    try {
      const orders = await this.model.findMany({
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

      return orders.map(order => this.mapToOrder(order));
    } catch (error) {
      throw error;
    }
  }

  async updateStatus(orderId: string, status: string): Promise<Order> {
    try {
      const order = await this.model.update({
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

      return this.mapToOrder(order);
    } catch (error) {
      throw error;
    }
  }

  private mapToOrder(dbOrder: OrderWithItems): Order {
    return {
      orderId: dbOrder.id,
      userId: dbOrder.userId,
      status: dbOrder.status,
      items: dbOrder.items.map(item => ({
        productId: item.productId,
        productName: item.product?.name || item.productName || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        subtotal: item.subtotal.toNumber()
      })),
      subtotal: dbOrder.subtotal.toNumber(),
      tax: dbOrder.tax.toNumber(),
      shipping: dbOrder.shipping.toNumber(),
      total: dbOrder.total.toNumber(),
      shippingAddress: {
        name: dbOrder.shippingName,
        street: dbOrder.shippingStreet,
        city: dbOrder.shippingCity,
        state: dbOrder.shippingState,
        zipCode: dbOrder.shippingZip,
        country: dbOrder.shippingCountry
      },
      createdAt: dbOrder.createdAt.toISOString()
    };
  }
}
