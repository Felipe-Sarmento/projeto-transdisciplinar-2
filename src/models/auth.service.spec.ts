import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'argon2';
import { DatabaseService } from '../database/database.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: {} },
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret',
            signOptions: { expiresIn: '30m' },
          }),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('retorna null quando o e-mail não existe', async () => {
      jest.spyOn(service, 'findByEmail').mockReturnValue(undefined);

      await expect(
        service.validateUser('naoexiste@cupcake.local', 'qualquer123'),
      ).resolves.toBeNull();
    });

    it('retorna null quando a senha está errada', async () => {
      jest.spyOn(service, 'findByEmail').mockReturnValue({
        id: 1,
        name: 'Admin',
        email: 'admin@cupcake.local',
        passwordHash: await hash('admin123'),
        role: 'ADMIN',
        createdAt: new Date(),
      });

      await expect(
        service.validateUser('admin@cupcake.local', 'senha-errada'),
      ).resolves.toBeNull();
    });

    it('retorna o usuário (sem hash) quando a senha está correta', async () => {
      jest.spyOn(service, 'findByEmail').mockReturnValue({
        id: 1,
        name: 'Admin',
        email: 'admin@cupcake.local',
        passwordHash: await hash('admin123'),
        role: 'ADMIN',
        createdAt: new Date(),
      });

      await expect(
        service.validateUser('admin@cupcake.local', 'admin123'),
      ).resolves.toEqual({
        id: 1,
        name: 'Admin',
        email: 'admin@cupcake.local',
        role: 'ADMIN',
      });
    });
  });

  describe('signToken', () => {
    it('gera um JWT verificável com sub, email e role', async () => {
      const token = await service.signToken({
        id: 1,
        name: 'Admin',
        email: 'admin@cupcake.local',
        role: 'ADMIN',
      });

      expect(typeof token).toBe('string');
      expect(jwtService.verify(token)).toMatchObject({
        sub: 1,
        name: 'Admin',
        email: 'admin@cupcake.local',
        role: 'ADMIN',
      });
    });
  });
});
