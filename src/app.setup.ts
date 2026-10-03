import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { engine } from 'express-handlebars';
import { AuthRedirectFilter } from './common/filters/auth-redirect.filter';

export function configureApp(app: NestExpressApplication): void {
  app.use(cookieParser());

  app.useGlobalFilters(new AuthRedirectFilter());

  app.engine(
    'hbs',
    engine({
      extname: '.hbs',
      defaultLayout: 'main',
      layoutsDir: join(__dirname, 'views', 'layouts'),
      partialsDir: join(__dirname, 'views', 'partials'),
    }),
  );
  app.setBaseViewsDir(join(__dirname, 'views'));
  app.setViewEngine('hbs');

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
