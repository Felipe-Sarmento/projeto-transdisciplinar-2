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
import { CategoryDto } from '../common/dto/category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CategoriesService } from '../models/categories.service';

@Controller('admin/categorias')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Render('admin/categorias/list')
  list(@Query('ok') ok?: string, @Query('erro') erro?: string) {
    return {
      title: 'Categorias',
      categories: this.categoriesService.findAll(),
      ok,
      erro,
    };
  }

  @Post()
  create(@Body() dto: CategoryDto, @Res() response: Response): void {
    try {
      this.categoriesService.create(dto.name);
      response.redirect('/admin/categorias?ok=Categoria criada');
    } catch {
      response.redirect('/admin/categorias?erro=Nome de categoria ja existe');
    }
  }

  @Post(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CategoryDto,
    @Res() response: Response,
  ): void {
    try {
      this.categoriesService.update(id, dto.name);
      response.redirect('/admin/categorias?ok=Categoria atualizada');
    } catch {
      response.redirect('/admin/categorias?erro=Nome de categoria ja existe');
    }
  }

  @Post(':id/excluir')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ): void {
    if (this.categoriesService.countProducts(id) > 0) {
      response.redirect('/admin/categorias?erro=Categoria possui produtos');
      return;
    }

    this.categoriesService.remove(id);
    response.redirect('/admin/categorias?ok=Categoria removida');
  }
}
