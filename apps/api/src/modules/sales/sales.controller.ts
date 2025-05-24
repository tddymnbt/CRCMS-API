import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesDto } from './dtos/create-sales.dto';
import { ISaleResponse } from './interfaces/sales.interface';
import { SalesService } from './sales.service';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create sales transaction' })
  async create(@Body() dto: SalesDto): Promise<ISaleResponse> {
    return this.service.createSale(dto);
  }
}
