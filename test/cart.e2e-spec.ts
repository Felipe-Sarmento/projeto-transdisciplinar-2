import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { DatabaseService } from './../src/database/database.service';
import { products } from './../src/database/schema/schema';
import { seedDatabase } from './../src/database/seed/seed';

function cartCookie(response: {
  headers: Record<string, unknown>;
}): string | undefined {
  const list = response.headers['set-cookie'];
  if (!Array.isArray(list)) {
    return undefined;
  }
  const raw = list.find(
    (cookie): cookie is string =>
      typeof cookie === 'string' && cookie.startsWith('cart='),
  );
  return raw?.split(';')[0];
}

describe('Carrinho (e2e)', () => {
  let app: INestApplication<App>;
  let database: DatabaseService;
  let baunilhaId: number;
  let pistacheId: number;
  let esgotadoId: number;
  let cookie: string | undefined;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    database = moduleFixture.get(DatabaseService);
    await seedDatabase(database.db);

    const byName = (name: string) =>
      database.db
        .select()
        .from(products)
        .where(eq(products.name, name))
        .all()
        .at(0);

    baunilhaId = byName('Baunilha Clássico')?.id ?? 0;
    pistacheId = byName('Pistache com Framboesa')?.id ?? 0;
    esgotadoId = byName('Vegano de Cacau')?.id ?? 0;
  });

  it('mostra carrinho vazio sem cookie', async () => {
    const response = await request(app.getHttpServer())
      .get('/carrinho')
      .expect(200);
    expect(response.text).toContain('carrinho está vazio');
  });

  it('adiciona um item e grava o cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .type('form')
      .send({ productId: String(baunilhaId) })
      .expect(302);

    cookie = cartCookie(response);
    expect(cookie).toBeDefined();

    const cart = await request(app.getHttpServer())
      .get('/carrinho')
      .set('Cookie', cookie as string)
      .expect(200);
    expect(cart.text).toContain('Baunilha Clássico');
  });

  it('mescla item repetido somando a quantidade (RN04)', async () => {
    const response = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .set('Cookie', cookie as string)
      .type('form')
      .send({ productId: String(baunilhaId) })
      .expect(302);
    cookie = cartCookie(response) ?? cookie;

    const cart = await request(app.getHttpServer())
      .get('/carrinho')
      .set('Cookie', cookie as string)
      .expect(200);
    expect(cart.text).toContain('R$ 17');
  });

  it('limita a quantidade ao estoque disponível (RN14)', async () => {
    const added = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .set('Cookie', cookie as string)
      .type('form')
      .send({ productId: String(pistacheId) })
      .expect(302);
    cookie = cartCookie(added) ?? cookie;

    const response = await request(app.getHttpServer())
      .post(`/carrinho/itens/${pistacheId}`)
      .set('Cookie', cookie as string)
      .type('form')
      .send({ quantity: '50' })
      .expect(302);
    cookie = cartCookie(response) ?? cookie;

    const cart = await request(app.getHttpServer())
      .get('/carrinho')
      .set('Cookie', cookie as string)
      .expect(200);
    expect(cart.text).toContain('value="8"');
  });

  it('recusa adicionar produto esgotado (RN13)', async () => {
    await request(app.getHttpServer())
      .post('/carrinho/itens')
      .set('Cookie', cookie as string)
      .type('form')
      .send({ productId: String(esgotadoId) })
      .expect(302);

    const cart = await request(app.getHttpServer())
      .get('/carrinho')
      .set('Cookie', cookie as string)
      .expect(200);
    expect(cart.text).not.toContain('Vegano de Cacau');
  });

  it('remove um item', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carrinho/itens/${baunilhaId}/remover`)
      .set('Cookie', cookie as string)
      .expect(302);
    cookie = cartCookie(response) ?? cookie;

    const cart = await request(app.getHttpServer())
      .get('/carrinho')
      .set('Cookie', cookie as string)
      .expect(200);
    expect(cart.text).not.toContain('Baunilha Clássico');
  });
});
