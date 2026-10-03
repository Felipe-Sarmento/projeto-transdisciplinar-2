import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../schema/schema';
import { seedDatabase } from './seed';

async function main(): Promise<void> {
  const file =
    process.env.DATABASE_URL ?? join(process.cwd(), 'database', 'sqlite.db');

  const sqlite = new Database(file);
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  await seedDatabase(db);

  sqlite.close();
  console.log(`Seed concluído em ${file}`);
}

void main().catch((error) => {
  console.error('Falha ao executar o seed:', error);
  process.exit(1);
});
