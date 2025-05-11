import { Body, Controller, Post } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from '../dtos/create-product.dto';
import { IProductResponse } from '../interfaces/product.interface';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(@Body() dto: CreateProductDto): Promise<IProductResponse> {
    return this.service.createProduct(dto);
  }
}
