import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { DatabaseService } from './../src/database/database.service';
import { orderItems, orders, products } from './../src/database/schema/schema';
import { seedDatabase } from './../src/database/seed/seed';

function setCookie(response: {
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

describe('Checkout (e2e)', () => {
  let app: INestApplication<App>;
  let database: DatabaseService;
  const createdOrderIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    database = moduleFixture.get(DatabaseService);
    await seedDatabase(database.db);
  });

  afterAll(() => {
    for (const id of createdOrderIds) {
      database.db.delete(orderItems).where(eq(orderItems.orderId, id)).run();
      database.db.delete(orders).where(eq(orders.id, id)).run();
    }
  });

  it('recusa finalizar sem nome/endereço', async () => {
    const product = database.db.select().from(products).all().at(0);
    if (product === undefined) throw new Error('produto ausente');

    const added = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .type('form')
      .send({ productId: String(product.id) })
      .expect(302);
    const cookie = setCookie(added) as string;

    const response = await request(app.getHttpServer())
      .post('/carrinho/confirmar')
      .set('Cookie', cookie)
      .type('form')
      .send({ customerName: '', deliveryAddress: '' })
      .expect(302);

    expect(response.headers.location).toContain('/carrinho?erro=');
  });

  it('confirma o pedido e limpa o carrinho', async () => {
    const product = database.db
      .select()
      .from(products)
      .all()
      .find((p) => p.availableQuantity > 0);
    if (product === undefined) throw new Error('produto ausente');

    const added = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .type('form')
      .send({ productId: String(product.id) })
      .expect(302);
    const cookie = setCookie(added) as string;

    const confirm = await request(app.getHttpServer())
      .post('/carrinho/confirmar')
      .set('Cookie', cookie)
      .type('form')
      .send({ customerName: 'Fulano de Tal', deliveryAddress: 'Rua A, 123' })
      .expect(302);

    const location = confirm.headers.location;
    expect(location).toMatch(/^\/pedido\/\d+$/);

    const orderId = Number(location.split('/').pop());
    createdOrderIds.push(orderId);

    const order = database.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .all()
      .at(0);
    expect(order?.customerName).toBe('Fulano de Tal');
    expect(order?.status).toBe('PENDENTE');

    const items = database.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .all();
    expect(items).toHaveLength(1);
    expect(items[0].unitPrice).toBe(product.price);

    // baixa de estoque
    const after = database.db
      .select()
      .from(products)
      .where(eq(products.id, product.id))
      .all()
      .at(0);
    expect(after?.availableQuantity).toBe(product.availableQuantity - 1);

    // carrinho limpo: cookie passa a vazio
    const clearedCookie = setCookie(confirm) ?? cookie;
    const cart = await request(app.getHttpServer())
      .get('/carrinho')
      .set('Cookie', clearedCookie)
      .expect(200);
    expect(cart.text).toContain('carrinho está vazio');
  });

  it('mostra a tela de pagamento via PIX (não pago)', async () => {
    const orderId = createdOrderIds[0];
    if (orderId === undefined) throw new Error('pedido ausente');

    const response = await request(app.getHttpServer())
      .get(`/pedido/${orderId}`)
      .expect(200);

    expect(response.text).toContain('pagamento via PIX');
    expect(response.text).toContain('Fulano de Tal');
    expect(response.text).toContain('Rua A, 123');
  });

  it('mostra o comprovante quando o pagamento é confirmado', async () => {
    const orderId = createdOrderIds[0];
    if (orderId === undefined) throw new Error('pedido ausente');

    database.db
      .update(orders)
      .set({ status: 'PAGAMENTO_REALIZADO' })
      .where(eq(orders.id, orderId))
      .run();

    const response = await request(app.getHttpServer())
      .get(`/pedido/${orderId}`)
      .expect(200);

    expect(response.text).toContain('Pagamento confirmado');
    expect(response.text).toContain('Fulano de Tal');
  });

  it('responde 404 para pedido inexistente', () => {
    return request(app.getHttpServer()).get('/pedido/999999').expect(404);
  });
});
