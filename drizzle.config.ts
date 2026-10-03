import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema/schema.ts',
  out: './database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? './database/sqlite.db',
  },
});
