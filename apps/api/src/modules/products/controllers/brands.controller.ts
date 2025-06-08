import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IProductMiscResponse,
  IProductMiscsResponse,
} from '../interfaces/p-misc.interface';
import { CreateProductMiscDto } from '../dtos/create-p-misc.dto';
import { UpdateProductMiscDto } from '../dtos/update-p-misc.dto';
import { DeleteProductMiscDto } from '../dtos/delete-p-misc.dto';
import { BrandsService } from '../services/brands.service';
import { ActivityLogsService } from 'src/modules/activity_logs/activity_logs.service';

@ApiTags('product brands')
@Controller('products/brands')
export class BrandsController {
  constructor(
    private readonly service: BrandsService,
    private loggerService: ActivityLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all product brands' })
  async findAll(): Promise<IProductMiscsResponse> {
    return this.service.findAll();
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get specific product brand' })
  async findOne(@Param('id') id: string): Promise<IProductMiscResponse> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product brand' })
  async create(
    @Body() dto: CreateProductMiscDto,
  ): Promise<IProductMiscResponse> {
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
  @ApiOperation({ summary: 'Update product brand' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductMiscDto,
  ): Promise<IProductMiscResponse> {
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
  @ApiOperation({ summary: 'Delete product brand' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductMiscDto,
  ): Promise<IProductMiscResponse> {
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
