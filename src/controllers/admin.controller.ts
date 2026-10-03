import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { RequestUser } from '../common/strategies/jwt.strategy';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  @Get()
  @Render('admin/home')
  getHome(@Req() request: Request & { user?: RequestUser }): {
    title: string;
    currentUser: RequestUser | undefined;
  } {
    return { title: 'Painel', currentUser: request.user };
  }
}
