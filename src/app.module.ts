import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './common/strategies/jwt.strategy';
import { AppController } from './controllers/app.controller';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { DatabaseService } from './database/database.service';
import { AppService } from './models/app.service';
import { AuthService } from './models/auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '30m' },
    }),
  ],
  controllers: [AppController, AuthController, AdminController],
  providers: [AppService, DatabaseService, AuthService, JwtStrategy],
})
export class AppModule {}
