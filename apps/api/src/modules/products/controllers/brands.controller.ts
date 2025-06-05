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

@ApiTags('product brands')
@Controller('products/brands')
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

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
    return this.service.create(dto);
  }

  @Put('id/:id')
  @ApiOperation({ summary: 'Update product brand' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductMiscDto,
  ): Promise<IProductMiscResponse> {
    return this.service.update(id, dto);
  }

  @Delete('id/:id')
  @ApiOperation({ summary: 'Delete product brand' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductMiscDto,
  ): Promise<IProductMiscResponse> {
    return this.service.remove(id, dto.deleted_by);
  }
}
