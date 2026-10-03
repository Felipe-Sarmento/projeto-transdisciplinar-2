import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Render,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrdersService, type OrderStatus } from '../models/orders.service';

const ALLOWED_ACTIONS = ['PAGAMENTO_REALIZADO', 'CANCELADO'] as const;

@Controller('admin/pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Render('admin/pedidos/list')
  list(@Query('ok') ok?: string, @Query('erro') erro?: string) {
    return {
      title: 'Pedidos',
      orders: this.ordersService.findAll(),
      adminSection: 'pedidos',
      ok,
      erro,
    };
  }

  @Post(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Res() response: Response,
  ): void {
    if (!(ALLOWED_ACTIONS as readonly string[]).includes(status)) {
      response.redirect('/admin/pedidos?erro=Acao+invalida');
      return;
    }

    if (this.ordersService.findById(id) === undefined) {
      response.redirect('/admin/pedidos?erro=Pedido+nao+encontrado');
      return;
    }

    this.ordersService.updateStatus(id, status as OrderStatus);

    const okMessage =
      status === 'CANCELADO' ? 'Pedido+cancelado' : 'Pagamento+confirmado';
    response.redirect(`/admin/pedidos?ok=${okMessage}`);
  }
}
