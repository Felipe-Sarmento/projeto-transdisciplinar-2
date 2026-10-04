import { Injectable } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { orderItems, orders, products } from '../database/schema/schema';

export interface OrderItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface OrderInput {
  userId?: number;
  customerName: string;
  deliveryAddress: string;
  items: OrderItemInput[];
}

export interface OrderLine {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderDetail {
  id: number;
  userId: number | null;
  customerName: string;
  status: string;
  total: number;
  deliveryAddress: string;
  createdAt: Date;
  lines: OrderLine[];
}

export const ORDER_STATUSES = [
  'PENDENTE',
  'PAGAMENTO_REALIZADO',
  'CANCELADO',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAID_STATUSES = ['PAGAMENTO_REALIZADO'] as const;

export function isPaidStatus(status: string): boolean {
  return (PAID_STATUSES as readonly string[]).includes(status);
}

export interface OrderSummary {
  id: number;
  customerName: string;
  status: string;
  total: number;
  deliveryAddress: string;
  createdAt: Date;
  itemsCount: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly database: DatabaseService) {}

  create(input: OrderInput): number | null {
    return this.database.db.transaction((tx) => {
      let total = 0;
      const prepared: OrderItemInput[] = [];

      for (const item of input.items) {
        const product = tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .all()
          .at(0);

        if (product === undefined || !product.active) {
          continue;
        }

        const quantity = Math.min(item.quantity, product.availableQuantity);
        if (quantity <= 0) {
          continue;
        }

        prepared.push({
          productId: item.productId,
          quantity,
          unitPrice: item.unitPrice,
        });
        total += item.unitPrice * quantity;

        tx.update(products)
          .set({ availableQuantity: product.availableQuantity - quantity })
          .where(eq(products.id, item.productId))
          .run();
      }

      if (prepared.length === 0) {
        return null;
      }

      const result = tx
        .insert(orders)
        .values({
          userId: input.userId ?? null,
          customerName: input.customerName,
          deliveryAddress: input.deliveryAddress,
          total: Math.round(total * 100) / 100,
          status: 'PENDENTE',
        })
        .run();

      const orderId = Number(result.lastInsertRowid);

      for (const item of prepared) {
        tx.insert(orderItems)
          .values({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })
          .run();
      }

      return orderId;
    });
  }

  findById(id: number): OrderDetail | undefined {
    const order = this.database.db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .all()
      .at(0);

    if (order === undefined) {
      return undefined;
    }

    const rows = this.database.db
      .select({
        productId: orderItems.productId,
        name: products.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id))
      .all();

    const lines: OrderLine[] = rows.map((row) => ({
      ...row,
      lineTotal: Math.round(row.unitPrice * row.quantity * 100) / 100,
    }));

    return {
      id: order.id,
      userId: order.userId,
      customerName: order.customerName,
      status: order.status,
      total: order.total,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
      lines,
    };
  }

  findAll(): OrderSummary[] {
    return this.database.db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        status: orders.status,
        total: orders.total,
        deliveryAddress: orders.deliveryAddress,
        createdAt: orders.createdAt,
        itemsCount: count(orderItems.id),
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .groupBy(orders.id)
      .orderBy(desc(orders.createdAt))
      .all();
  }

  updateStatus(id: number, status: OrderStatus): void {
    this.database.db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .run();
  }

  cancel(id: number): boolean {
    return this.database.db.transaction((tx) => {
      const order = tx
        .select()
        .from(orders)
        .where(eq(orders.id, id))
        .all()
        .at(0);

      if (order === undefined || order.status === 'CANCELADO') {
        return false;
      }

      const items = tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, id))
        .all();

      for (const item of items) {
        const product = tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .all()
          .at(0);

        if (product === undefined) {
          continue;
        }

        tx.update(products)
          .set({ availableQuantity: product.availableQuantity + item.quantity })
          .where(eq(products.id, item.productId))
          .run();
      }

      tx.update(orders)
        .set({ status: 'CANCELADO' })
        .where(eq(orders.id, id))
        .run();
      return true;
    });
  }
}
