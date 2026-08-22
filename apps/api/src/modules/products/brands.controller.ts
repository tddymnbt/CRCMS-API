import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ProductMiscListResponseDto,
  ProductMiscResponseDto,
} from './application/dtos/p-misc.response.dto';
import { CreateProductMiscDto } from './application/dtos/create-p-misc.dto';
import { UpdateProductMiscDto } from './application/dtos/update-p-misc.dto';
import { DeleteProductMiscDto } from './application/dtos/delete-p-misc.dto';
import {
  ApiBusinessError,
  ApiValidationError,
} from 'src/common/swagger/api-error-responses.decorator';
import { BrandsApplicationService } from './application/services/brands.application.service';
import { ActivityLogsApplicationService } from 'src/modules/activity_logs/application/services/activity-logs.application.service';

@ApiTags('product brands')
@ApiBearerAuth('access-token')
@Controller('products/brands')
export class BrandsController {
  constructor(
    private readonly service: BrandsApplicationService,
    private loggerService: ActivityLogsApplicationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all product brand records' })
  @ApiOkResponse({
    description: 'List of product brand records',
    type: ProductMiscListResponseDto,
  })
  async findAll(): Promise<ProductMiscListResponseDto> {
    return this.service.findAll();
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get specific product brand record' })
  @ApiParam({ name: 'id', description: 'External id of the product brand' })
  @ApiOkResponse({
    description: 'product brand details',
    type: ProductMiscResponseDto,
  })
  @ApiBusinessError(404, 'No product brand exists with the given external id')
  async findOne(@Param('id') id: string): Promise<ProductMiscResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product brand record' })
  @ApiCreatedResponse({
    description: 'product brand successfully created',
    type: ProductMiscResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(409, 'A product brand with the same name already exists')
  async create(
    @Body() dto: CreateProductMiscDto,
  ): Promise<ProductMiscResponseDto> {
    const response = await this.service.create(dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.created_by,
        'Product',
        'create',
        `Created product brand ${response.data.name}`,
        response.data.external_id,
      );
    }

    return response;
  }

  @Put('id/:id')
  @ApiOperation({ summary: 'Update product brand record' })
  @ApiParam({ name: 'id', description: 'External id of the product brand' })
  @ApiOkResponse({
    description: 'product brand successfully updated',
    type: ProductMiscResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(400, '`updated_by` is required')
  @ApiBusinessError(404, 'No product brand exists with the given external id')
  @ApiBusinessError(409, 'A product brand with the same name already exists')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductMiscDto,
  ): Promise<ProductMiscResponseDto> {
    const response = await this.service.update(id, dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.updated_by,
        'Product',
        'update',
        `Updated product brand ${id}`,
        id,
      );
    }

    return response;
  }

  @Delete('id/:id')
  @ApiOperation({ summary: 'Delete product brand record' })
  @ApiParam({ name: 'id', description: 'External id of the product brand' })
  @ApiOkResponse({
    description: 'product brand successfully soft-deleted',
    type: ProductMiscResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(400, '`deleted_by` is required')
  @ApiBusinessError(404, 'No product brand exists with the given external id')
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductMiscDto,
  ): Promise<ProductMiscResponseDto> {
    const response = await this.service.remove(id, dto.deleted_by);

    if (response.status.success) {
      this.loggerService.log(
        dto.deleted_by,
        'Product',
        'update',
        `Updated product brand ${id}`,
        id,
      );
    }

    return response;
  }
}
