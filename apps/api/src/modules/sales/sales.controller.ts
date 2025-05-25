import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesDto } from './dtos/create-sales.dto';
import { ISaleResponse, ISalesResponse } from './interfaces/sales.interface';
import { SalesService } from './sales.service';
import { FindSalesDto } from './dtos/find-all-sales.dto';
import { RecordPaymentDto } from './dtos/record-payment.dto';
import { CancelSaleDto } from './dtos/cancel-sale.dto';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'Find all sales' })
  async findAll(@Query() query: FindSalesDto): Promise<ISalesResponse> {
    return this.service.findAll(query, 'A');
  }

  @Get('regular')
  @ApiOperation({ summary: 'Find all regular sales' })
  async findAllRegular(@Query() query: FindSalesDto): Promise<ISalesResponse> {
    return this.service.findAll(query, 'R');
  }

  @Get('layaway')
  @ApiOperation({ summary: 'Find all layaway sales' })
  async findAllLayaway(@Query() query: FindSalesDto): Promise<ISalesResponse> {
    return this.service.findAll(query, 'L');
  }

  @Get('consigned')
  @ApiOperation({ summary: 'Find all consigned sales' })
  async findAllConsigned(
    @Query() query: FindSalesDto,
  ): Promise<ISalesResponse> {
    return this.service.findAll(query, 'CN');
  }

  @Get('cancelled')
  @ApiOperation({ summary: 'Find all cancelled sales' })
  async findAllCancelled(
    @Query() query: FindSalesDto,
  ): Promise<ISalesResponse> {
    return this.service.findAll(query, 'C');
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

  @Post('payment')
  @ApiOperation({ summary: 'Record payment' })
  async recordPayment(@Body() dto: RecordPaymentDto): Promise<ISaleResponse> {
    return this.service.recordPayment(dto);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel sale transaction' })
  async cancelSale(@Body() dto: CancelSaleDto): Promise<ISaleResponse> {
    return this.service.cancelSales(dto);
  }
}
