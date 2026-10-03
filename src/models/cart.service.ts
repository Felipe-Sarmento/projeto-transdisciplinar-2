import { Injectable } from '@nestjs/common';
import { ProductsService } from './products.service';

export interface CartItem {
  productId: number;
  quantity: number;
}

export interface CartLine {
  productId: number;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface CartView {
  lines: CartLine[];
  subtotal: number;
  count: number;
}

const MAX_QUANTITY = 99;

@Injectable()
export class CartService {
  constructor(private readonly productsService: ProductsService) {}

  parse(raw: unknown): CartItem[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    const items: CartItem[] = [];
    for (const entry of raw) {
      if (typeof entry !== 'object' || entry === null) {
        continue;
      }
      const productId = Number((entry as { productId?: unknown }).productId);
      const quantity = Number((entry as { quantity?: unknown }).quantity);
      if (!Number.isInteger(productId) || productId <= 0) {
        continue;
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        continue;
      }
      items.push({ productId, quantity: Math.min(quantity, MAX_QUANTITY) });
    }

    return this.merge(items);
  }

  add(
    items: CartItem[],
    productId: number,
    quantity: number,
    maxQty: number,
  ): CartItem[] {
    const limit = this.limitFor(maxQty);
    const safeQuantity = Math.min(Math.max(quantity, 1), limit);

    if (items.some((item) => item.productId === productId)) {
      return items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(item.quantity + safeQuantity, limit) }
          : item,
      );
    }

    return [...items, { productId, quantity: safeQuantity }];
  }

  update(
    items: CartItem[],
    productId: number,
    quantity: number,
    maxQty: number,
  ): CartItem[] {
    if (quantity <= 0) {
      return this.remove(items, productId);
    }

    const limit = this.limitFor(maxQty);
    return items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(quantity, limit) }
        : item,
    );
  }

  remove(items: CartItem[], productId: number): CartItem[] {
    return items.filter((item) => item.productId !== productId);
  }

  totalQuantity(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  buildView(items: CartItem[]): CartView {
    const lines: CartLine[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = this.productsService.findById(item.productId);
      if (
        product === undefined ||
        !product.active ||
        product.availableQuantity <= 0
      ) {
        continue;
      }

      const quantity = Math.min(
        item.quantity,
        product.availableQuantity,
        MAX_QUANTITY,
      );
      if (quantity <= 0) {
        continue;
      }

      const lineTotal = this.round(product.price * quantity);
      subtotal += lineTotal;
      lines.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        unitPrice: product.price,
        quantity,
        lineTotal,
      });
    }

    return {
      lines,
      subtotal: this.round(subtotal),
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
    };
  }

  private merge(items: CartItem[]): CartItem[] {
    const map = new Map<number, number>();
    for (const item of items) {
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
    }

    return [...map.entries()].map(([productId, quantity]) => ({
      productId,
      quantity: Math.min(quantity, MAX_QUANTITY),
    }));
  }

  private limitFor(maxQty: number): number {
    return Math.max(1, Math.min(MAX_QUANTITY, maxQty));
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
