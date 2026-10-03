import { hash } from 'argon2';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema/schema';
import { categories, products, users } from '../schema/schema';

export const ADMIN_EMAIL = 'admin@cupcake.local';
export const ADMIN_PASSWORD = 'admin123';

const CATEGORIES = [
  { name: 'Tradicionais', slug: 'tradicionais' },
  { name: 'Gourmet', slug: 'gourmet' },
  { name: 'Veganos', slug: 'veganos' },
];

const PRODUCTS = [
  {
    name: 'Baunilha Clássico',
    description: 'Massa de baunilha com buttercream e granulado.',
    price: 8.5,
    imageUrl: 'https://placehold.co/300x300/fda4af/ffffff?text=Baunilha',
    categorySlug: 'tradicionais',
  },
  {
    name: 'Chocolate Belga',
    description: 'Massa de chocolate belga com ganache.',
    price: 9.0,
    imageUrl: 'https://placehold.co/300x300/9a3412/ffffff?text=Chocolate',
    categorySlug: 'tradicionais',
  },
  {
    name: 'Red Velvet',
    description: 'Massa vermelha com cream cheese frosting.',
    price: 12.0,
    imageUrl: 'https://placehold.co/300x300/be123c/ffffff?text=Red+Velvet',
    categorySlug: 'gourmet',
  },
  {
    name: 'Pistache com Framboesa',
    description: 'Massa de pistache com recheio de framboesa.',
    price: 14.5,
    imageUrl: 'https://placehold.co/300x300/15803d/ffffff?text=Pistache',
    categorySlug: 'gourmet',
  },
  {
    name: 'Vegano de Coco',
    description: 'Massa vegana de coco com cobertura cremosa.',
    price: 10.0,
    imageUrl: 'https://placehold.co/300x300/0f766e/ffffff?text=Coco',
    categorySlug: 'veganos',
  },
  {
    name: 'Vegano de Cacau',
    description: 'Massa vegana de cacau com ganache de castanha.',
    price: 10.5,
    imageUrl: 'https://placehold.co/300x300/7c2d12/ffffff?text=Cacau',
    categorySlug: 'veganos',
  },
];

export async function seedDatabase(
  db: BetterSQLite3Database<typeof schema>,
): Promise<void> {
  const passwordHash = await hash(ADMIN_PASSWORD);

  db.insert(users)
    .values({
      name: 'Administrador',
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
    })
    .onConflictDoNothing()
    .run();

  for (const category of CATEGORIES) {
    db.insert(categories).values(category).onConflictDoNothing().run();
  }

  const categoryRows = db.select().from(categories).all();
  const categoryIdBySlug = new Map(
    categoryRows.map((row) => [row.slug, row.id]),
  );

  const existingNames = new Set(
    db
      .select({ name: products.name })
      .from(products)
      .all()
      .map((row) => row.name),
  );

  for (const product of PRODUCTS) {
    if (existingNames.has(product.name)) {
      continue;
    }

    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (categoryId === undefined) {
      continue;
    }

    db.insert(products)
      .values({
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        active: true,
        categoryId,
      })
      .run();
  }
}
