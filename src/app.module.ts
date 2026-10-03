import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { DatabaseService } from './database/database.service';
import { AppService } from './models/app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DatabaseService],
})
export class AppModule {}
