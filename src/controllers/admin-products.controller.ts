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
import { ProductDto } from '../common/dto/product.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CategoriesService } from '../models/categories.service';
import { ProductsService } from '../models/products.service';

@Controller('admin/produtos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  @Render('admin/produtos/list')
  list(@Query('ok') ok?: string, @Query('erro') erro?: string) {
    return {
      title: 'Produtos',
      products: this.productsService.findAllWithCategory(),
      ok,
      erro,
    };
  }

  @Get('novo')
  @Render('admin/produtos/form')
  showCreate() {
    return {
      title: 'Novo produto',
      product: null,
      categories: this.categoriesService.findAll(),
      action: '/admin/produtos',
    };
  }

  @Post()
  create(@Body() dto: ProductDto, @Res() response: Response): void {
    this.productsService.create(dto);
    response.redirect('/admin/produtos?ok=Produto criado');
  }

  @Get(':id/editar')
  @Render('admin/produtos/form')
  showEdit(@Param('id', ParseIntPipe) id: number) {
    return {
      title: 'Editar produto',
      product: this.productsService.findById(id),
      categories: this.categoriesService.findAll(),
      action: `/admin/produtos/${id}`,
    };
  }

  @Post(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProductDto,
    @Res() response: Response,
  ): void {
    this.productsService.update(id, dto);
    response.redirect('/admin/produtos?ok=Produto atualizado');
  }

  @Post(':id/ativar')
  toggle(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ): void {
    this.productsService.toggleActive(id);
    response.redirect('/admin/produtos?ok=Situacao atualizada');
  }
}
