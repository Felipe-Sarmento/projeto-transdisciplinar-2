import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHomeData(): { title: string } {
    return { title: 'Cupcake Gourmet' };
  }
}
