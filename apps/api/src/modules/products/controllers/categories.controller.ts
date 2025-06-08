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
import { CategoriesService } from '../services/categories.service';
import {
  IProductMiscResponse,
  IProductMiscsResponse,
} from '../interfaces/p-misc.interface';
import { CreateProductMiscDto } from '../dtos/create-p-misc.dto';
import { UpdateProductMiscDto } from '../dtos/update-p-misc.dto';
import { DeleteProductMiscDto } from '../dtos/delete-p-misc.dto';
import { ActivityLogsService } from 'src/modules/activity_logs/activity_logs.service';

@ApiTags('product categories')
@Controller('products/categories')
export class CategoriesController {
  constructor(
    private readonly service: CategoriesService,
    private loggerService: ActivityLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all product categories' })
  async findAll(): Promise<IProductMiscsResponse> {
    return this.service.findAll();
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get specific product category' })
  async findOne(@Param('id') id: string): Promise<IProductMiscResponse> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product category' })
  async create(
    @Body() dto: CreateProductMiscDto,
  ): Promise<IProductMiscResponse> {
    const response = await this.service.create(dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.created_by,
        'Product',
        'create',
        `Created product category ${response.data.name}`,
        response.data.external_id,
      );
    }

    return response;
  }

  @Put('id/:id')
  @ApiOperation({ summary: 'Update product category' })
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
        `Updated product category ${id}`,
        id,
      );
    }

    return response;
  }

  @Delete('id/:id')
  @ApiOperation({ summary: 'Delete product category' })
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
        `Updated product category ${id}`,
        id,
      );
    }

    return response;
  }
}
