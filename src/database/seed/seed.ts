import { hash } from 'argon2';
import { eq } from 'drizzle-orm';
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
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7grzJD04vXZCW7kfzh7zLITI0z9XkeSYWfsz-KrsRqw&s=10',
    availableQuantity: 20,
    categorySlug: 'tradicionais',
  },
  {
    name: 'Chocolate Belga',
    description: 'Massa de chocolate belga com ganache.',
    price: 9.0,
    imageUrl:
      'https://santaluzia.vtexassets.com/arquivos/ids/1000923/263508.png',
    availableQuantity: 15,
    categorySlug: 'tradicionais',
  },
  {
    name: 'Red Velvet',
    description: 'Massa vermelha com cream cheese frosting.',
    price: 12.0,
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSl2nbXFtiAWLZG-A8ILvjM7FlOwCw7T9doVhcjQ93lAwxZXwbUh92iA_w&s=10',
    availableQuantity: 12,
    categorySlug: 'gourmet',
  },
  {
    name: 'Pistache com Framboesa',
    description: 'Massa de pistache com recheio de framboesa.',
    price: 14.5,
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4t7p7EAUNN89CXdegM3diC_I28BkbktB65uAa29aK1FvZ_ApzFxgTfrc&s=10',
    availableQuantity: 8,
    categorySlug: 'gourmet',
  },
  {
    name: 'Vegano de Coco',
    description: 'Massa vegana de coco com cobertura cremosa.',
    price: 10.0,
    imageUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRW48iGsWR96bBV2qnntXNKmHoDgCoeDZw2ySF59cObg&s=10',
    availableQuantity: 10,
    categorySlug: 'veganos',
  },
  {
    name: 'Vegano de Cacau',
    description: 'Massa vegana de cacau com ganache de castanha.',
    price: 10.5,
    imageUrl:
      'https://www.vaisefood.com/wp-content/uploads/2014/03/cupcake.jpg',
    availableQuantity: 0,
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

  const existingByName = new Map(
    db
      .select()
      .from(products)
      .all()
      .map((row) => [row.name, row]),
  );

  for (const product of PRODUCTS) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (categoryId === undefined) {
      continue;
    }

    const existing = existingByName.get(product.name);
    if (existing !== undefined) {
      db.update(products)
        .set({
          availableQuantity: product.availableQuantity,
          imageUrl: product.imageUrl,
        })
        .where(eq(products.id, existing.id))
        .run();
      continue;
    }

    db.insert(products)
      .values({
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        active: true,
        availableQuantity: product.availableQuantity,
        categoryId,
      })
      .run();
  }
}
