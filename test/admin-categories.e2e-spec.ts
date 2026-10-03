import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { DatabaseService } from './../src/database/database.service';
import { categories } from './../src/database/schema/schema';
import { seedDatabase } from './../src/database/seed/seed';

const TEST_CATEGORY = 'Categoria E2E';

describe('Admin categorias (e2e)', () => {
  let app: INestApplication<App>;
  let database: DatabaseService;
  let cookies: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    database = moduleFixture.get(DatabaseService);
    await seedDatabase(database.db);

    const login = await request(app.getHttpServer())
      .post('/login')
      .type('form')
      .send({ email: 'admin@cupcake.local', password: 'admin123' })
      .expect(302);

    cookies = login.headers['set-cookie'] as unknown as string[];
  });

  afterAll(() => {
    database.db
      .delete(categories)
      .where(eq(categories.name, TEST_CATEGORY))
      .run();
  });

  it('redireciona para /login sem autenticação', () => {
    return request(app.getHttpServer())
      .get('/admin/categorias')
      .expect(302)
      .expect('Location', '/login');
  });

  it('cria uma categoria com slug', async () => {
    await request(app.getHttpServer())
      .post('/admin/categorias')
      .set('Cookie', cookies)
      .type('form')
      .send({ name: TEST_CATEGORY })
      .expect(302);

    const created = database.db
      .select()
      .from(categories)
      .where(eq(categories.name, TEST_CATEGORY))
      .all()
      .at(0);

    expect(created?.slug).toBe('categoria-e2e');
  });

  it('recusa categoria duplicada', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/categorias')
      .set('Cookie', cookies)
      .type('form')
      .send({ name: TEST_CATEGORY })
      .expect(302);

    expect(response.headers.location).toContain('erro=');
  });

  it('bloqueia exclusão de categoria com produtos', async () => {
    const withProducts = database.db
      .select()
      .from(categories)
      .where(eq(categories.slug, 'tradicionais'))
      .all()
      .at(0);
    if (withProducts === undefined) throw new Error('categoria ausente');

    const response = await request(app.getHttpServer())
      .post(`/admin/categorias/${withProducts.id}/excluir`)
      .set('Cookie', cookies)
      .expect(302);

    expect(response.headers.location).toContain('erro=');
    expect(
      database.db
        .select()
        .from(categories)
        .where(eq(categories.id, withProducts.id))
        .all().length,
    ).toBe(1);
  });

  it('exclui categoria vazia', async () => {
    const created = database.db
      .select()
      .from(categories)
      .where(eq(categories.name, TEST_CATEGORY))
      .all()
      .at(0);
    if (created === undefined) throw new Error('categoria ausente');

    await request(app.getHttpServer())
      .post(`/admin/categorias/${created.id}/excluir`)
      .set('Cookie', cookies)
      .expect(302);

    expect(
      database.db
        .select()
        .from(categories)
        .where(eq(categories.id, created.id))
        .all().length,
    ).toBe(0);
  });
});
