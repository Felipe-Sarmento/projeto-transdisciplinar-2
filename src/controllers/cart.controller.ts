import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Render,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { setFlash } from '../common/utils/flash';
import { CartService } from '../models/cart.service';
import { ProductsService } from '../models/products.service';

const CART_COOKIE = 'cart';
const CART_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@Controller('carrinho')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @Render('carrinho/index')
  index(@Req() request: Request, @Query('erro') erro?: string) {
    const items = this.cartService.parse(request.cookies?.cart);
    const view = this.cartService.buildView(items);

    return { title: 'Carrinho', erro, ...view };
  }

  @Post('itens')
  add(
    @Req() request: Request,
    @Body('productId', ParseIntPipe) productId: number,
    @Res() response: Response,
  ): void {
    const product = this.productsService.findById(productId);

    if (
      product === undefined ||
      !product.active ||
      product.availableQuantity <= 0
    ) {
      setFlash(response, 'error', 'Produto indisponível no momento.');
      response.redirect(this.backTo(request, '/carrinho'));
      return;
    }

    const items = this.cartService.parse(request.cookies?.cart);
    const updated = this.cartService.add(
      items,
      productId,
      1,
      product.availableQuantity,
    );

    this.save(response, updated);
    setFlash(response, 'success', `${product.name} adicionado ao carrinho.`);
    response.redirect(this.backTo(request, '/carrinho'));
  }

  @Post('itens/:id')
  update(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity') quantity: string,
    @Res() response: Response,
  ): void {
    const product = this.productsService.findById(id);
    const parsed = Number(quantity);
    const safeQuantity = Number.isFinite(parsed) ? parsed : 1;

    const items = this.cartService.parse(request.cookies?.cart);
    const updated = this.cartService.update(
      items,
      id,
      safeQuantity,
      product?.availableQuantity ?? 1,
    );

    this.save(response, updated);
    setFlash(
      response,
      'success',
      safeQuantity <= 0
        ? 'Item removido do carrinho.'
        : 'Quantidade atualizada.',
    );
    response.redirect('/carrinho');
  }

  @Post('itens/:id/remover')
  remove(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ): void {
    const items = this.cartService.parse(request.cookies?.cart);
    const updated = this.cartService.remove(items, id);

    this.save(response, updated);
    setFlash(response, 'success', 'Item removido do carrinho.');
    response.redirect('/carrinho');
  }

  private save(response: Response, items: unknown): void {
    response.cookie(CART_COOKIE, items, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: CART_MAX_AGE,
    });
  }

  private backTo(request: Request, fallback: string): string {
    const referer = request.get('referer');
    if (referer === undefined) {
      return fallback;
    }

    try {
      const url = new URL(referer);
      return `${url.pathname}${url.search}`;
    } catch {
      return fallback;
    }
  }
}
