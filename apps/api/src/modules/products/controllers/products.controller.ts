import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from '../dtos/create-product.dto';
import {
  IProductResponse,
  IProductsResponse,
} from '../interfaces/product.interface';
import { FindProductsDto } from '../dtos/find-all-products.dto';
import { UpdateProductStockDto } from '../dtos/update-p-stock.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Find all products' })
  async findAll(@Query() query: FindProductsDto): Promise<IProductsResponse> {
    return this.service.findAll(query);
  }
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

  @Post('update-stock')
  @ApiOperation({ summary: 'Update product stock' })
  async updateProductStock(
    @Body() dto: UpdateProductStockDto,
  ): Promise<IProductResponse> {
    return this.service.updateProductStock(dto);
  }
}
