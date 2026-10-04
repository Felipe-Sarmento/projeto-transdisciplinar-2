import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { DatabaseService } from './../src/database/database.service';
import {
  orderItems,
  orders,
  products,
  users,
} from './../src/database/schema/schema';
import {
  CLIENTE_EMAIL,
  CLIENTE_PASSWORD,
  seedDatabase,
} from './../src/database/seed/seed';

function extractCookie(
  response: { headers: Record<string, unknown> },
  name: string,
): string | undefined {
  const list = response.headers['set-cookie'];
  if (!Array.isArray(list)) {
    return undefined;
  }
  const raw = list.find(
    (cookie): cookie is string =>
      typeof cookie === 'string' && cookie.startsWith(`${name}=`),
  );
  return raw?.split(';')[0];
}

describe('Checkout (e2e)', () => {
  let app: INestApplication<App>;
  let database: DatabaseService;
  const createdOrderIds: number[] = [];
  let clientCookie: string;

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
      .send({ email: CLIENTE_EMAIL, password: CLIENTE_PASSWORD })
      .expect(302);
    clientCookie = extractCookie(login, 'access_token') as string;
  });

  afterAll(() => {
    for (const id of createdOrderIds) {
      database.db.delete(orderItems).where(eq(orderItems.orderId, id)).run();
      database.db.delete(orders).where(eq(orders.id, id)).run();
    }
  });

  it('exige login para finalizar o pedido', async () => {
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
    const cartCookie = extractCookie(added, 'cart') as string;

    await request(app.getHttpServer())
      .post('/carrinho/confirmar')
      .set('Cookie', cartCookie)
      .type('form')
      .send({ customerName: 'Fulano', deliveryAddress: 'Rua A, 123' })
      .expect(302)
      .expect('Location', '/login');
  });

  it('recusa finalizar sem nome/endereço', async () => {
    const product = database.db.select().from(products).all().at(0);
    if (product === undefined) throw new Error('produto ausente');

    const added = await request(app.getHttpServer())
      .post('/carrinho/itens')
      .type('form')
      .send({ productId: String(product.id) })
      .expect(302);
    const cartCookie = extractCookie(added, 'cart') as string;

    const response = await request(app.getHttpServer())
      .post('/carrinho/confirmar')
      .set('Cookie', `${clientCookie}; ${cartCookie}`)
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
    const cartCookie = extractCookie(added, 'cart') as string;

    const confirm = await request(app.getHttpServer())
      .post('/carrinho/confirmar')
      .set('Cookie', `${clientCookie}; ${cartCookie}`)
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
    expect(order?.userId).not.toBeNull();

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
    const clearedCookie = extractCookie(confirm, 'cart') ?? cartCookie;
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
      .set('Cookie', clientCookie)
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
      .set('Cookie', clientCookie)
      .expect(200);

    expect(response.text).toContain('Pagamento confirmado');
    expect(response.text).toContain('Fulano de Tal');
  });

  it('exige login para ver o pedido', () => {
    const orderId = createdOrderIds[0];
    if (orderId === undefined) throw new Error('pedido ausente');

    return request(app.getHttpServer())
      .get(`/pedido/${orderId}`)
      .expect(302)
      .expect('Location', '/login');
  });

  it('não permite outro cliente ver o pedido', async () => {
    const orderId = createdOrderIds[0];
    if (orderId === undefined) throw new Error('pedido ausente');

    const email = `intruso-${Date.now()}@cupcake.local`;
    const register = await request(app.getHttpServer())
      .post('/cadastro')
      .type('form')
      .send({ name: 'Intruso', email, password: 'senha1234' })
      .expect(302);
    const intruderCookie = extractCookie(register, 'access_token') as string;

    await request(app.getHttpServer())
      .get(`/pedido/${orderId}`)
      .set('Cookie', intruderCookie)
      .expect(404);

    database.db.delete(users).where(eq(users.email, email)).run();
  });

  it('responde 404 para pedido inexistente', () => {
    return request(app.getHttpServer())
      .get('/pedido/999999')
      .set('Cookie', clientCookie)
      .expect(404);
  });
});
