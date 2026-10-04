import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { engine } from 'express-handlebars';
import { AuthRedirectFilter } from './common/filters/auth-redirect.filter';
import { NotFoundFilter } from './common/filters/not-found.filter';
import { FLASH_COOKIE, type Toast } from './common/utils/flash';

export function configureApp(app: NestExpressApplication): void {
  app.use(cookieParser());

  app.useGlobalFilters(new AuthRedirectFilter(), new NotFoundFilter());

  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const cookies = req.cookies as Record<string, unknown> | undefined;

    const token = cookies?.access_token;
    if (typeof token === 'string') {
      try {
        res.locals.currentUser =
          jwtService.verify<Record<string, unknown>>(token);
      } catch {
        // token inválido/expirado: header mostra estado deslogado
      }
    }

    const cart = cookies?.cart;
    if (Array.isArray(cart)) {
      res.locals.cartCount = cart.reduce<number>((sum, entry) => {
        const quantity = Number((entry as { quantity?: unknown }).quantity);
        return sum + (Number.isFinite(quantity) ? quantity : 0);
      }, 0);
    }

    const flash = cookies?.[FLASH_COOKIE];
    if (flash !== undefined && flash !== null) {
      if (typeof flash === 'object') {
        res.locals.toast = flash as Toast;
      } else if (typeof flash === 'string') {
        try {
          res.locals.toast = JSON.parse(flash) as Toast;
        } catch {
          // flash inválido: ignora
        }
      }
      res.clearCookie(FLASH_COOKIE);
    }

    next();
  });

  app.engine(
    'hbs',
    engine({
      extname: '.hbs',
      defaultLayout: 'main',
      layoutsDir: join(__dirname, 'views', 'layouts'),
      partialsDir: join(__dirname, 'views', 'partials'),
      helpers: {
        eq: (a: unknown, b: unknown): boolean => a === b,
        date: (value: unknown): string => {
          if (value instanceof Date) {
            return value.toLocaleDateString('pt-BR');
          }
          if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
          }
          return '';
        },
        statusClass: (status: unknown): string => {
          switch (status) {
            case 'PENDENTE':
              return 'bg-amber-100 text-amber-700';
            case 'PAGAMENTO_REALIZADO':
              return 'bg-green-100 text-green-700';
            case 'CANCELADO':
              return 'bg-red-100 text-red-700';
            default:
              return 'bg-stone-200 text-stone-600';
          }
        },
        statusLabel: (status: unknown): string => {
          switch (status) {
            case 'PENDENTE':
              return 'Aguardando pagamento';
            case 'PAGAMENTO_REALIZADO':
              return 'Pagamento realizado';
            case 'CANCELADO':
              return 'Cancelado';
            default:
              return typeof status === 'string' ? status : '';
          }
        },
      },
    }),
  );
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
