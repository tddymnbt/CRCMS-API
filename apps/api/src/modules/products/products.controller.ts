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
import { ProductsApplicationService } from './application/services/products.application.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './application/dtos/create-product.dto';
import {
  FindConsignorProductsDto,
  FindProductsDto,
} from './application/dtos/find-all-products.dto';
import { UpdateProductStockDto } from './application/dtos/update-p-stock.dto';
import { UpdateProductDto } from './application/dtos/update-product.dto';
import { DeleteProductDto } from './application/dtos/delete-product.dto';
import { StockMovementApplicationService } from './application/services/stock-movement.application.service';
import { FindProductTransactionsDto } from './application/dtos/find-p-trans.dto';
import {
  ProductListResponseDto,
  ProductResponseDto,
  ProductTransactionListResponseDto,
} from './application/dtos/product.response.dto';
import { CountStatsResponseDto } from 'src/common/swagger/count-stats.response.dto';
import {
  ApiBusinessError,
  ApiValidationError,
} from 'src/common/swagger/api-error-responses.decorator';
import { ActivityLogsApplicationService } from 'src/modules/activity_logs/application/services/activity-logs.application.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly service: ProductsApplicationService,
    private readonly StockMovementApplicationService: StockMovementApplicationService,
    private loggerService: ActivityLogsApplicationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all products' })
  @ApiOkResponse({
    description: 'Paginated list of products',
    type: ProductListResponseDto,
  })
  @ApiValidationError()
  async findAll(
    @Query() query: FindProductsDto,
  ): Promise<ProductListResponseDto> {
    return this.service.findAll(query);
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Find specific product' })
  @ApiOkResponse({ description: 'Product details', type: ProductResponseDto })
  @ApiBusinessError(
    404,
    'No stock or product exists with the given external id',
  )
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product' })
  @ApiCreatedResponse({
    description:
      'Product successfully created together with its stock and condition records',
    type: ProductResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Consignor details are required when `is_consigned` is true',
  )
  @ApiBusinessError(409, 'A product with the same name/code already exists')
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
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
  @ApiOkResponse({
    description:
      'Stock quantity adjusted via a manual increase/decrease movement. Decreasing below the available quantity fails with HTTP 400.',
    type: ProductResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    '`updated_by` is required, quantity must be > 0, or not enough available quantity to decrease',
  )
  @ApiBusinessError(404, 'No stock exists with the given external id')
  async updateProductStock(
    @Param('id') id: string,
    @Body() dto: UpdateProductStockDto,
  ): Promise<ProductResponseDto> {
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
  @ApiOkResponse({
    description: 'Product and its stock successfully soft-deleted',
    type: ProductResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    '`deleted_by` is required or the product has existing transactions',
  )
  @ApiBusinessError(
    404,
    'No stock or product exists with the given external id',
  )
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductDto,
  ): Promise<ProductResponseDto> {
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
  @ApiOkResponse({
    description: 'Product successfully updated',
    type: ProductResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    '`updated_by` is required or consignor details are missing/invalid',
  )
  @ApiBusinessError(
    404,
    'No stock or product exists with the given external id',
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
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
  @ApiOkResponse({
    description: 'Paginated stock movement history for the given product',
    type: ProductTransactionListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(404, 'No stock exists with the given external id')
  async getProductMovements(
    @Param('id') id: string,
    @Body() dto: FindProductTransactionsDto,
  ): Promise<ProductTransactionListResponseDto> {
    return this.StockMovementApplicationService.getProductTransaction(id, dto);
  }

  @Get('consignor/:id/items')
  @ApiOperation({ summary: 'Find all consignor products' })
  @ApiOkResponse({
    description: 'Paginated list of products consigned by the given client',
    type: ProductListResponseDto,
  })
  @ApiValidationError()
  async findAllConsignorItems(
    @Param('id') id: string,
    @Query() query: FindConsignorProductsDto,
  ): Promise<ProductListResponseDto> {
    return this.service.findConsignorItems(id, query);
  }

  @Get('stats/counts')
  @ApiOperation({ summary: 'Find product count' })
  @ApiOkResponse({
    description: 'Product counts grouped by creation period',
    type: CountStatsResponseDto,
  })
  @ApiQuery({
    name: 'isConsigned',
    required: false,
    type: Boolean,
    description:
      'When true, counts only consigned products; otherwise counts all products',
  })
  async getCounts(
    @Query() query: { isConsigned: boolean },
  ): Promise<CountStatsResponseDto> {
    return this.service.getProductCounts(query.isConsigned);
  }
}
