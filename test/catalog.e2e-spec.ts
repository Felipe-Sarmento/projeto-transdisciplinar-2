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

describe('Catálogo (e2e)', () => {
  let app: INestApplication<App>;
  let database: DatabaseService;

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

  it('lista os cupcakes ativos', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.text).toContain('Cupcakes artesanais gourmet');
    expect(response.text).toContain('Baunilha Clássico');
  });

  it('filtra por categoria', async () => {
    const response = await request(app.getHttpServer())
      .get('/?categoria=veganos')
      .expect(200);

    expect(response.text).toContain('Vegano de Coco');
    expect(response.text).not.toContain('Baunilha Clássico');
  });

  it('não exibe produtos inativos', async () => {
    const target = database.db.select().from(products).all().at(0);
    if (target === undefined) throw new Error('produto ausente');

    database.db
      .update(products)
      .set({ active: false })
      .where(eq(products.id, target.id))
      .run();

    const response = await request(app.getHttpServer()).get('/').expect(200);
    expect(response.text).not.toContain(target.name);

    database.db
      .update(products)
      .set({ active: true })
      .where(eq(products.id, target.id))
      .run();
  });

  it('exibe o detalhe do produto ativo', async () => {
    const target = database.db
      .select()
      .from(products)
      .where(eq(products.name, 'Baunilha Clássico'))
      .all()
      .at(0);
    if (target === undefined) throw new Error('produto ausente');

    const response = await request(app.getHttpServer())
      .get(`/produtos/${target.id}`)
      .expect(200);

    expect(response.text).toContain('Massa de baunilha');
  });

  it('marca produto esgotado', async () => {
    const esgotado = database.db
      .select()
      .from(products)
      .where(eq(products.name, 'Vegano de Cacau'))
      .all()
      .at(0);
    if (esgotado === undefined) throw new Error('produto ausente');

    const response = await request(app.getHttpServer())
      .get(`/produtos/${esgotado.id}`)
      .expect(200);

    expect(response.text).toContain('Esgotado');
  });

  it('retorna 404 para produto inexistente', () => {
    return request(app.getHttpServer()).get('/produtos/999999').expect(404);
  });
});
