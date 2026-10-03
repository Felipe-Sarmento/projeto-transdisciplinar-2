import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { CatalogController } from './controllers/catalog.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { DatabaseService } from './database/database.service';
import { AuthService } from './models/auth.service';
import { CategoriesService } from './models/categories.service';
import { ProductsService } from './models/products.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '30m' },
    }),
  ],
  controllers: [
    CatalogController,
    AuthController,
    AdminController,
    AdminProductsController,
    AdminCategoriesController,
  ],
  providers: [
    DatabaseService,
    AuthService,
    JwtStrategy,
    ProductsService,
    CategoriesService,
  ],
})
export class AppModule {}
