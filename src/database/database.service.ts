import { join } from 'node:path';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/schema';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  public readonly db: BetterSQLite3Database<typeof schema>;
  private readonly sqlite: Database.Database;

  constructor() {
    const file =
      process.env.DATABASE_URL ?? join(process.cwd(), 'database', 'sqlite.db');

    this.sqlite = new Database(file);
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('foreign_keys = ON');

    this.db = drizzle(this.sqlite, { schema });
  }

  onModuleDestroy(): void {
    this.sqlite.close();
  }
}
