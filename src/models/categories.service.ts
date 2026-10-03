import { Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { categories, products } from '../database/schema/schema';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class CategoriesService {
  constructor(private readonly database: DatabaseService) {}

  findAll() {
    return this.database.db
      .select()
      .from(categories)
      .orderBy(categories.name)
      .all();
  }

  create(name: string): number {
    const result = this.database.db
      .insert(categories)
      .values({ name, slug: slugify(name) })
      .run();

    return Number(result.lastInsertRowid);
  }

  update(id: number, name: string): void {
    this.database.db
      .update(categories)
      .set({ name, slug: slugify(name) })
      .where(eq(categories.id, id))
      .run();
  }

  countProducts(id: number): number {
    const rows = this.database.db
      .select({ total: count() })
      .from(products)
      .where(eq(products.categoryId, id))
      .all();

    return rows[0]?.total ?? 0;
  }

  remove(id: number): void {
    this.database.db.delete(categories).where(eq(categories.id, id)).run();
  }
}
