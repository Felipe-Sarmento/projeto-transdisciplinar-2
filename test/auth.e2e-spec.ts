import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { DatabaseService } from './../src/database/database.service';
import { users } from './../src/database/schema/schema';
import {
  CLIENTE_EMAIL,
  CLIENTE_PASSWORD,
  seedDatabase,
} from './../src/database/seed/seed';

describe('Autenticação (e2e)', () => {
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

  describe('GET /login', () => {
    it('renderiza o formulário de login', () => {
      return request(app.getHttpServer())
        .get('/login')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect((res) => {
          expect(res.text).toContain('Entrar');
        });
    });
  });

  describe('GET /admin', () => {
    it('redireciona para /login quando não autenticado', () => {
      return request(app.getHttpServer())
        .get('/admin')
        .expect(302)
        .expect('Location', '/login');
    });

    it('permite acesso com cookie de ADMIN e mostra o nome + Sair', async () => {
      const login = await request(app.getHttpServer())
        .post('/login')
        .type('form')
        .send({ email: 'admin@cupcake.local', password: 'admin123' })
        .expect(302);

      const cookies = login.headers['set-cookie'] as unknown as string[];

      return request(app.getHttpServer())
        .get('/admin')
        .set('Cookie', cookies)
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Painel administrativo');
          expect(res.text).toContain('Administrador');
          expect(res.text).toContain('Sair');
        });
    });
  });

  describe('POST /login', () => {
    it('rejeita credenciais inválidas com erro genérico', () => {
      return request(app.getHttpServer())
        .post('/login')
        .type('form')
        .send({ email: 'admin@cupcake.local', password: 'senha-errada' })
        .expect(401)
        .expect((res) => {
          expect(res.text).toContain('inválidos');
        });
    });

    it('autentica o admin e grava o cookie de sessão', async () => {
      const response = await request(app.getHttpServer())
        .post('/login')
        .type('form')
        .send({ email: 'admin@cupcake.local', password: 'admin123' })
        .expect(302)
        .expect('Location', '/admin');

      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(String(setCookie)).toContain('access_token=');
      expect(String(setCookie)).toContain('HttpOnly');
    });
  });

  describe('GET /cadastro', () => {
    it('renderiza o formulário de cadastro', () => {
      return request(app.getHttpServer())
        .get('/cadastro')
        .expect(200)
        .expect('Content-Type', /html/)
        .expect((res) => {
          expect(res.text).toContain('Criar conta');
        });
    });
  });

  describe('POST /cadastro', () => {
    it('cria a conta, grava o cookie e redireciona para o catálogo', async () => {
      const email = `novo-${Date.now()}@cupcake.local`;

      const response = await request(app.getHttpServer())
        .post('/cadastro')
        .type('form')
        .send({ name: 'Novo Cliente', email, password: 'senha1234' })
        .expect(302)
        .expect('Location', '/');

      const setCookie = response.headers['set-cookie'];
      expect(String(setCookie)).toContain('access_token=');

      database.db.delete(users).where(eq(users.email, email)).run();
    });

    it('rejeita e-mail já cadastrado', () => {
      return request(app.getHttpServer())
        .post('/cadastro')
        .type('form')
        .send({
          name: 'Duplicado',
          email: CLIENTE_EMAIL,
          password: 'senha1234',
        })
        .expect(409)
        .expect((res) => {
          expect(res.text).toContain('já está cadastrado');
        });
    });
  });

  describe('POST /login (CLIENTE)', () => {
    it('autentica o cliente e redireciona para o catálogo', () => {
      return request(app.getHttpServer())
        .post('/login')
        .type('form')
        .send({ email: CLIENTE_EMAIL, password: CLIENTE_PASSWORD })
        .expect(302)
        .expect('Location', '/');
    });
  });

  describe('POST /logout', () => {
    it('limpa o cookie e redireciona para /login', () => {
      return request(app.getHttpServer())
        .post('/logout')
        .expect(302)
        .expect('Location', '/login')
        .expect((res) => {
          const setCookie = res.headers['set-cookie'];
          expect(String(setCookie)).toContain('access_token=;');
        });
    });
  });
});
