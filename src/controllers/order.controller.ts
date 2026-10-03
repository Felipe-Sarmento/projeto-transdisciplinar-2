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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CartService } from '../models/cart.service';
import { OrdersService, isPaidStatus } from '../models/orders.service';

@Controller()
export class OrderController {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('carrinho/confirmar')
  confirm(
    @Req() request: Request,
    @Body('customerName') customerName: string,
    @Body('deliveryAddress') deliveryAddress: string,
    @Res() response: Response,
  ): void {
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
  @Render('pedido/show')
  show(@Param('id', ParseIntPipe) id: number) {
    const order = this.ordersService.findById(id);

    if (order === undefined) {
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
