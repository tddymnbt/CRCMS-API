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
  IProductCount,
  IProductResponse,
  IProductsResponse,
} from '../interfaces/product.interface';
import {
  FindConsignorProductsDto,
  FindProductsDto,
} from '../dtos/find-all-products.dto';
import { UpdateProductStockDto } from '../dtos/update-p-stock.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { DeleteProductDto } from '../dtos/delete-product.dto';
import { StockMovementService } from '../services/stock-movement.service';
import { FindProductTransactionsDto } from '../dtos/find-p-trans.dto';
import { IProductTransactionsResponse } from '../interfaces/p-trans.interface';
import { ActivityLogsService } from 'src/modules/activity_logs/activity_logs.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly service: ProductsService,
    private readonly stockMovementService: StockMovementService,
    private loggerService: ActivityLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all products' })
  async findAll(@Query() query: FindProductsDto): Promise<IProductsResponse> {
    return this.service.findAll(query);
  }
  @Get('id/:id')
  @ApiOperation({ summary: 'Find specific product' })
  async findOne(@Param('id') id: string): Promise<IProductResponse> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(@Body() dto: CreateProductDto): Promise<IProductResponse> {
    const response = await this.service.createProduct(dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.created_by,
        'Product',
        'create',
        `Created product ${response.data.name}`,
        response.data.stock_external_id,
      );
    }

    return response;
  }

  @Put('update-stock/id/:id')
  @ApiOperation({ summary: 'Update product stock' })
  async updateProductStock(
    @Param('id') id: string,
    @Body() dto: UpdateProductStockDto,
  ): Promise<IProductResponse> {
    const response = await this.service.updateProductStock(id, dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.updated_by,
        'Product',
        'update',
        `Updated product stock ${response.data.name}`,
        id,
      );
    }

    return response;
  }

  @Delete('id/:id')
  @ApiOperation({ summary: 'Delete product' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductDto,
  ): Promise<IProductResponse> {
    const response = await this.service.remove(id, dto.deleted_by);

    if (response.status.success) {
      this.loggerService.log(
        dto.deleted_by,
        'Product',
        'delete',
        `Deleted product ${response.data.name}`,
        id,
      );
    }
    return response;
  }

  @Put('id/:id')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<IProductResponse> {
    const response = await this.service.update(id, dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.updated_by,
        'Product',
        'update',
        `Updated product ${response.data.name}`,
        id,
      );
    }

    return response;
  }

  @Post('id/:id/transactions')
  @ApiOperation({ summary: 'Get product movements' })
  async getProductMovements(
    @Param('id') id: string,
    @Body() dto: FindProductTransactionsDto,
  ): Promise<IProductTransactionsResponse> {
    return this.stockMovementService.getProductTransaction(id, dto);
  }

  @Get('consignor/:id/items')
  @ApiOperation({ summary: 'Find all consignor products' })
  async findAllConsignorItems(
    @Param('id') id: string,
    @Query() query: FindConsignorProductsDto,
  ): Promise<IProductsResponse> {
    return this.service.findConsignorItems(id, query);
  }

  @Get('stats/counts')
  @ApiOperation({ summary: 'Find product count' })
  async getCounts(
    @Query() query: { isConsigned: boolean },
  ): Promise<IProductCount> {
    return this.service.getProductCounts(query.isConsigned);
  }
}
