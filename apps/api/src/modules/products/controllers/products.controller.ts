import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from '../dtos/create-product.dto';
import { IProductResponse } from '../interfaces/product.interface';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Find specific product' })
  async findOne(@Param('id') id: string): Promise<IProductResponse> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(@Body() dto: CreateProductDto): Promise<IProductResponse> {
    return this.service.createProduct(dto);
  }
}
