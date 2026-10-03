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

function cartCookie(response: {
  headers: Record<string, unknown>;
}): string | undefined {
  const list = response.headers['set-cookie'];
  if (!Array.isArray(list)) return undefined;
  const raw = list.find(
    (c): c is string => typeof c === 'string' && c.startsWith('cart='),
  );
  return raw?.split(';')[0];
}

describe('Admin pedidos (e2e)', () => {
  let app: INestApplication<App>;
  let database: DatabaseService;
  let cookies: string[] = [];
  let orderId = 0;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    database = moduleFixture.get(DatabaseService);
    await seedDatabase(database.db);

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
    const cart = cartCookie(added) as string;

    const confirm = await request(app.getHttpServer())
      .post('/carrinho/confirmar')
      .set('Cookie', cart)
      .type('form')
      .send({ customerName: 'Cliente Pedido', deliveryAddress: 'Rua B, 45' })
      .expect(302);
    orderId = Number(confirm.headers.location.split('/').pop());

    const login = await request(app.getHttpServer())
      .post('/login')
      .type('form')
      .send({ email: 'admin@cupcake.local', password: 'admin123' })
      .expect(302);
    cookies = login.headers['set-cookie'] as unknown as string[];
  });

  afterAll(() => {
    database.db.delete(orderItems).where(eq(orderItems.orderId, orderId)).run();
    database.db.delete(orders).where(eq(orders.id, orderId)).run();
  });

  it('redireciona para /login sem autenticação', () => {
    return request(app.getHttpServer())
      .get('/admin/pedidos')
      .expect(302)
      .expect('Location', '/login');
  });

  it('lista os pedidos', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/pedidos')
      .set('Cookie', cookies)
      .expect(200);

    expect(response.text).toContain('Pedidos');
    expect(response.text).toContain('Cliente Pedido');
    expect(response.text).toContain(`#${orderId}`);
  });

  it('confirma o pagamento do pedido', async () => {
    await request(app.getHttpServer())
      .post(`/admin/pedidos/${orderId}/status`)
      .set('Cookie', cookies)
      .type('form')
      .send({ status: 'PAGAMENTO_REALIZADO' })
      .expect(302);

    const order = database.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .all()
      .at(0);
    expect(order?.status).toBe('PAGAMENTO_REALIZADO');
  });

  it('recusa ação inválida', async () => {
    const response = await request(app.getHttpServer())
      .post(`/admin/pedidos/${orderId}/status`)
      .set('Cookie', cookies)
      .type('form')
      .send({ status: 'EM_PREPARO' })
      .expect(302);

    expect(response.headers.location).toContain('erro=');
    const order = database.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .all()
      .at(0);
    expect(order?.status).toBe('PAGAMENTO_REALIZADO');
  });

  it('cancela o pedido', async () => {
    await request(app.getHttpServer())
      .post(`/admin/pedidos/${orderId}/status`)
      .set('Cookie', cookies)
      .type('form')
      .send({ status: 'CANCELADO' })
      .expect(302);

    const order = database.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .all()
      .at(0);
    expect(order?.status).toBe('CANCELADO');
  });
});
