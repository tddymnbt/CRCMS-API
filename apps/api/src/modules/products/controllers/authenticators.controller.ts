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
import { AuthenticatorsService } from '../services/authenticators.service';

@ApiTags('product authenticators')
@Controller('products/authenticators')
export class AuthenticatorsController {
  constructor(private readonly service: AuthenticatorsService) {}

  @Get()
  @ApiOperation({ summary: 'Find all product authenticators' })
  async findAll(): Promise<IProductMiscsResponse> {
    return this.service.findAll();
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get specific product authenticator' })
  async findOne(@Param('id') id: string): Promise<IProductMiscResponse> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product authenticator' })
  async create(
    @Body() dto: CreateProductMiscDto,
  ): Promise<IProductMiscResponse> {
    return this.service.create(dto);
  }

  @Put('id/:id')
  @ApiOperation({ summary: 'Update product authenticator' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductMiscDto,
  ): Promise<IProductMiscResponse> {
    return this.service.update(id, dto);
  }

  @Delete('id/:id')
  @ApiOperation({ summary: 'Delete product authenticator' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductMiscDto,
  ): Promise<IProductMiscResponse> {
    return this.service.remove(id, dto.deleted_by);
  }
}
