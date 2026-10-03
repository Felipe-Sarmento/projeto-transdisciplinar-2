import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Render,
} from '@nestjs/common';
import { CategoriesService } from '../models/categories.service';
import { ProductsService } from '../models/products.service';

@Controller()
export class CatalogController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  @Render('catalog/index')
  index(@Query('categoria') categoria?: string) {
    return {
      title: 'Catálogo',
      products: this.productsService.findActive(categoria),
      categories: this.categoriesService.findAll(),
      selectedCategory: categoria ?? null,
    };
  }

  @Get('produtos/:id')
  @Render('catalog/show')
  show(@Param('id', ParseIntPipe) id: number) {
    const product = this.productsService.findActiveById(id);

    if (product === undefined) {
      throw new NotFoundException('Produto não encontrado');
    }

    return { title: product.name, product };
  }
}
