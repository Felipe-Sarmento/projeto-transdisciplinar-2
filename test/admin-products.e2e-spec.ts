import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { DatabaseService } from './../src/database/database.service';
import { categories, products } from './../src/database/schema/schema';
import { seedDatabase } from './../src/database/seed/seed';

const TEST_PRODUCT = 'Produto E2E';
const VALID_ATTRS = {
  name: TEST_PRODUCT,
  description: 'Produto criado em teste',
  price: '5.5',
  imageUrl: '',
  availableQuantity: '3',
  active: 'true',
};

describe('Admin produtos (e2e)', () => {
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
    database.db.delete(products).where(eq(products.name, TEST_PRODUCT)).run();
  });

  it('redireciona para /login sem autenticação', () => {
    return request(app.getHttpServer())
      .get('/admin/produtos')
      .expect(302)
      .expect('Location', '/login');
  });

  it('lista produtos com estoque', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/produtos')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.text).toContain('Produtos');
    expect(response.text).toContain('Baunilha Clássico');
  });

  it('cria um produto válido com estoque', async () => {
    const category = database.db.select().from(categories).all().at(0);
    if (category === undefined) throw new Error('categoria ausente');

    await request(app.getHttpServer())
      .post('/admin/produtos')
      .set('Cookie', cookies)
      .type('form')
      .send({ ...VALID_ATTRS, categoryId: String(category.id) })
      .expect(302);

    const created = database.db
      .select()
      .from(products)
      .where(eq(products.name, TEST_PRODUCT))
      .all()
      .at(0);

    expect(created).toBeDefined();
    expect(created?.availableQuantity).toBe(3);
    expect(created?.active).toBe(true);
  });

  it('rejeita produto com preço inválido', async () => {
    const category = database.db.select().from(categories).all().at(0);
    if (category === undefined) throw new Error('categoria ausente');

    await request(app.getHttpServer())
      .post('/admin/produtos')
      .set('Cookie', cookies)
      .type('form')
      .send({
        ...VALID_ATTRS,
        name: 'Inválido E2E',
        price: '0',
        categoryId: String(category.id),
      })
      .expect(400);
  });

  it('ativa/desativa um produto', async () => {
    const created = database.db
      .select()
      .from(products)
      .where(eq(products.name, TEST_PRODUCT))
      .all()
      .at(0);
    if (created === undefined) throw new Error('produto ausente');

    await request(app.getHttpServer())
      .post(`/admin/produtos/${created.id}/ativar`)
      .set('Cookie', cookies)
      .expect(302);

    const after = database.db
      .select()
      .from(products)
      .where(eq(products.id, created.id))
      .all()
      .at(0);

    expect(after?.active).toBe(false);
  });
});
