import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesDto } from './dtos/create-sales.dto';
import { ISaleResponse, ISalesResponse } from './interfaces/sales.interface';
import { SalesService } from './sales.service';
import { FindSalesDto } from './dtos/find-all-sales.dto';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'Find all sales' })
  async findAll(@Query() query: FindSalesDto): Promise<ISalesResponse> {
    return this.service.findAll(query);
  }
  @Get('id/:id')
  @ApiOperation({ summary: 'Find specific sale' })
  async findOne(@Param('id') id: string): Promise<ISaleResponse> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create sales transaction' })
  async create(@Body() dto: SalesDto): Promise<ISaleResponse> {
    return this.service.createSale(dto);
  }
}
