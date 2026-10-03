import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { orderItems, orders, products } from '../database/schema/schema';

export interface OrderItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface OrderInput {
  customerName: string;
  deliveryAddress: string;
  total: number;
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
  customerName: string;
  status: string;
  total: number;
  deliveryAddress: string;
  createdAt: Date;
  lines: OrderLine[];
}

@Injectable()
export class OrdersService {
  constructor(private readonly database: DatabaseService) {}

  create(input: OrderInput): number {
    return this.database.db.transaction((tx) => {
      const result = tx
        .insert(orders)
        .values({
          customerName: input.customerName,
          deliveryAddress: input.deliveryAddress,
          total: input.total,
          status: 'PENDENTE',
        })
        .run();

      const orderId = Number(result.lastInsertRowid);

      for (const item of input.items) {
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
      customerName: order.customerName,
      status: order.status,
      total: order.total,
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
      lines,
    };
  }
}
