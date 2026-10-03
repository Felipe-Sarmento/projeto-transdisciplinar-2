import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { engine } from 'express-handlebars';
import { AuthRedirectFilter } from './common/filters/auth-redirect.filter';
import { NotFoundFilter } from './common/filters/not-found.filter';

export function configureApp(app: NestExpressApplication): void {
  app.use(cookieParser());

  app.useGlobalFilters(new AuthRedirectFilter(), new NotFoundFilter());

  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const token = (req.cookies as Record<string, unknown> | undefined)
      ?.access_token;
    if (typeof token === 'string') {
      try {
        res.locals.currentUser =
          jwtService.verify<Record<string, unknown>>(token);
      } catch {
        // token inválido/expirado: header mostra estado deslogado
      }
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
      },
    }),
  );
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
