import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from '../dtos/create-product.dto';
import {
  IProductResponse,
  IProductsResponse,
} from '../interfaces/product.interface';
import { FindProductsDto } from '../dtos/find-all-products.dto';
import { UpdateProductStockDto } from '../dtos/update-p-stock.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { DeleteProductDto } from '../dtos/delete-product.dto';
import { StockMovementService } from '../services/stock-movement.service';
import { FindProductTransactionsDto } from '../dtos/find-p-trans.dto';
import { IProductTransactionsResponse } from '../interfaces/p-trans.interface';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly service: ProductsService,
    private readonly stockMovementService: StockMovementService,
  ) {}

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

  @Put('update-stock/:id')
  @ApiOperation({ summary: 'Update product stock' })
  async updateProductStock(
    @Param('id') id: string,
    @Body() dto: UpdateProductStockDto,
  ): Promise<IProductResponse> {
    return this.service.updateProductStock(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductDto,
  ): Promise<IProductResponse> {
    return this.service.remove(id, dto.deleted_by);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<IProductResponse> {
    return this.service.update(id, dto);
  }

  @Post(':id/transactions')
  @ApiOperation({ summary: 'Get product movements' })
  async getProductMovements(
    @Param('id') id: string,
    @Body() dto: FindProductTransactionsDto,
  ): Promise<IProductTransactionsResponse> {
    return this.stockMovementService.getProductTransaction(id, dto);
  }
}
