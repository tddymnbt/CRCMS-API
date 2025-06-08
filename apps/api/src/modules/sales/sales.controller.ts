import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesDto } from './dtos/create-sales.dto';
import {
  ICustomerFrequencyResponse,
  ISaleResponse,
  ISalesResponse,
  ISaleTransactionsResponse,
} from './interfaces/sales.interface';
import { SalesService } from './sales.service';
import { FindSalesDto } from './dtos/find-all-sales.dto';
import { RecordPaymentDto } from './dtos/record-payment.dto';
import { CancelSaleDto } from './dtos/cancel-sale.dto';
import { ExtendLayawayDueDateDto } from './dtos/extend-due-date.dto';
import { GetAllSalesTransactionsStats } from './dtos/get-sales-trans-stats.dto';
import { CustomerPurchaseFrequencyDto } from './dtos/customer-purchase-frequency.dto';
import { ActivityLogsService } from '../activity_logs/activity_logs.service';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(
    private readonly service: SalesService,
    private loggerService: ActivityLogsService,
  ) {}

  //#region GET API

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

  @Get('overdue')
  @ApiOperation({ summary: 'Find all overdue layaway sales' })
  async findAllOverdue(@Query() query: FindSalesDto): Promise<ISalesResponse> {
    return this.service.findAll(query, 'OD');
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

  @Get('paid')
  @ApiOperation({ summary: 'Find all fully paid sales' })
  async findAllPaid(@Query() query: FindSalesDto): Promise<ISalesResponse> {
    return this.service.findAll(query, 'FP');
  }

  @Get('client/:id/transactions')
  @ApiOperation({ summary: 'Find all client sales transactions' })
  async findAllClientTransactions(
    @Param('id') id: string,
    @Query() query: FindSalesDto,
  ): Promise<ISalesResponse> {
    return this.service.findAll(query, 'CT', id);
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Find specific sale' })
  async findOne(@Param('id') id: string): Promise<ISaleResponse> {
    return this.service.findOne(id);
  }

  //#endregion

  @Post()
  @ApiOperation({ summary: 'Create sales transaction' })
  async create(@Body() dto: SalesDto): Promise<ISaleResponse> {
    const response = await this.service.createSale(dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.created_by,
        'Sales',
        'create',
        `Created sale transaction ${response.data.sale_external_id}`,
        response.data.sale_external_id,
      );
    }

    return response;
  }

  @Post('payment')
  @ApiOperation({ summary: 'Record payment' })
  async recordPayment(@Body() dto: RecordPaymentDto): Promise<ISaleResponse> {
    const response = await this.service.recordPayment(dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.created_by,
        'Sales',
        'update',
        `Updated sale transaction - recorded a payment ${response.data.sale_external_id}`,
        response.data.sale_external_id,
      );
    }

    return response;
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel sale transaction' })
  async cancelSale(@Body() dto: CancelSaleDto): Promise<ISaleResponse> {
    const response = await this.service.cancelSales(dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.cancelled_by,
        'Sales',
        'update',
        `Updated sale transaction - cancelled a transaction ${dto.sale_ext_id}`,
        dto.sale_ext_id,
      );
    }

    return response;
  }

  @Put('layaway/extend-due-date/:id')
  @ApiOperation({ summary: 'Extend layaway due date' })
  async extendLayawayDueDate(
    @Param('id') id: string,
    @Body() dto: ExtendLayawayDueDateDto,
  ): Promise<ISaleResponse> {
    const response = await this.service.extendLayawayDueDate(id, dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.updated_by,
        'Sales',
        'update',
        `Updated sale transaction - extended layaway due date ${id}`,
        id,
      );
    }

    return response;
  }

  @Get('transaction/stats')
  @ApiOperation({ summary: 'Get sales transactions statistics' })
  async findAllTransactionsStats(
    @Query() query: GetAllSalesTransactionsStats,
  ): Promise<ISaleTransactionsResponse> {
    return this.service.getSalesStats(query.mode, query.dateFrom, query.dateTo);
  }

  @Get('transaction/frequencies')
  @ApiOperation({ summary: 'Get customer purchase frequencies' })
  async getCustomerFrequency(
    @Query() dto: CustomerPurchaseFrequencyDto,
  ): Promise<ICustomerFrequencyResponse> {
    const data = await this.service.getCustomerPurchaseFrequency(dto);
    return {
      status: {
        success: true,
        message: 'Customer Purchase Frequency retrieved',
      },
      data,
    };
  }
}
