import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { categories, products } from '../database/schema/schema';

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  availableQuantity: number;
  active: boolean;
}

export interface ProductWithCategory {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  active: boolean;
  availableQuantity: number;
  categoryId: number;
  categoryName: string;
}

const withCategorySelection = {
  id: products.id,
  name: products.name,
  description: products.description,
  price: products.price,
  imageUrl: products.imageUrl,
  active: products.active,
  availableQuantity: products.availableQuantity,
  categoryId: products.categoryId,
  categoryName: categories.name,
};

@Injectable()
export class ProductsService {
  constructor(private readonly database: DatabaseService) {}

  findAllWithCategory(): ProductWithCategory[] {
    return this.database.db
      .select(withCategorySelection)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(products.name)
      .all();
  }

  findById(id: number) {
    const rows = this.database.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .all();

    return rows[0];
  }

  findActive(categorySlug?: string): ProductWithCategory[] {
    const condition =
      categorySlug === undefined || categorySlug === ''
        ? eq(products.active, true)
        : and(eq(products.active, true), eq(categories.slug, categorySlug));

    return this.database.db
      .select(withCategorySelection)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(condition)
      .orderBy(products.name)
      .all();
  }

  findActiveById(id: number): ProductWithCategory | undefined {
    const rows = this.database.db
      .select(withCategorySelection)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.id, id), eq(products.active, true)))
      .all();

    return rows[0];
  }

  create(input: ProductInput): number {
    const result = this.database.db
      .insert(products)
      .values({
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl ?? null,
        active: input.active,
        availableQuantity: input.availableQuantity,
        categoryId: input.categoryId,
      })
      .run();

    return Number(result.lastInsertRowid);
  }

  update(id: number, input: ProductInput): void {
    this.database.db
      .update(products)
      .set({
        name: input.name,
        description: input.description,
        price: input.price,
        imageUrl: input.imageUrl ?? null,
        active: input.active,
        availableQuantity: input.availableQuantity,
        categoryId: input.categoryId,
      })
      .where(eq(products.id, id))
      .run();
  }

  toggleActive(id: number): void {
    const current = this.findById(id);
    if (current === undefined) {
      return;
    }

    this.database.db
      .update(products)
      .set({ active: !current.active })
      .where(eq(products.id, id))
      .run();
  }
}
