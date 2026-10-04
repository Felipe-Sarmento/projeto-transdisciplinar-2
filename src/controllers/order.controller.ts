import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { RequestUser } from '../common/strategies/jwt.strategy';
import { CartService } from '../models/cart.service';
import { OrdersService, isPaidStatus } from '../models/orders.service';

@Controller()
export class OrderController {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('carrinho/confirmar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENTE')
  confirm(
    @Req() request: Request,
    @Body('customerName') customerName: string,
    @Body('deliveryAddress') deliveryAddress: string,
    @Res() response: Response,
  ): void {
    const user = request.user as RequestUser;
    const items = this.cartService.parse(request.cookies?.cart);
    const view = this.cartService.buildView(items);

    if (view.lines.length === 0) {
      response.redirect('/carrinho');
      return;
    }

    const name = (customerName ?? '').trim();
    const address = (deliveryAddress ?? '').trim();

    if (name === '' || address === '') {
      response.redirect('/carrinho?erro=Informe+o+nome+e+o+endereco');
      return;
    }

    const orderId = this.ordersService.create({
      userId: user.id,
      customerName: name,
      deliveryAddress: address,
      items: view.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    });

    if (orderId === null) {
      response.redirect('/carrinho?erro=Itens+indisponiveis+no+momento');
      return;
    }

    response.clearCookie('cart');
    response.redirect(`/pedido/${orderId}`);
  }

  @Get('pedido/:id')
  @UseGuards(JwtAuthGuard)
  @Render('pedido/show')
  show(@Req() request: Request, @Param('id', ParseIntPipe) id: number) {
    const user = request.user as RequestUser;
    const order = this.ordersService.findById(id);

    if (
      order === undefined ||
      (order.userId !== user.id && user.role !== 'ADMIN')
    ) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return {
      title: `Pedido #${order.id}`,
      order,
      paid: isPaidStatus(order.status),
      cancelled: order.status === 'CANCELADO',
    };
  }
}
