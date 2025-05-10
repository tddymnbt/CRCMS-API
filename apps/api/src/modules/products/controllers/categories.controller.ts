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
  IProductCategoriesResponse,
  IProductCategoryResponse,
} from '../interfaces/category.interface';
import { CreateProductCategoryDto } from '../dtos/create-p-category.dto';
import { UpdateProductCategoryDto } from '../dtos/update-p-category.dto';
import { DeleteProductCategoryDto } from '../dtos/delete-p-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Find all product categories' })
  async findAll(): Promise<IProductCategoriesResponse> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific product category' })
  async findOne(@Param('id') id: string): Promise<IProductCategoryResponse> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product category' })
  async create(
    @Body() dto: CreateProductCategoryDto,
  ): Promise<IProductCategoryResponse> {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product category' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
  ): Promise<IProductCategoryResponse> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product category' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductCategoryDto,
  ): Promise<IProductCategoryResponse> {
    return this.service.remove(id, dto.deleted_by);
  }
}
