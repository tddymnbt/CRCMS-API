import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SalesDto } from './application/dtos/create-sales.dto';
import { FindSalesDto } from './application/dtos/find-all-sales.dto';
import { RecordPaymentDto } from './application/dtos/record-payment.dto';
import { CancelSaleDto } from './application/dtos/cancel-sale.dto';
import { ExtendLayawayDueDateDto } from './application/dtos/extend-due-date.dto';
import { GetAllSalesTransactionsStats } from './application/dtos/get-sales-trans-stats.dto';
import { CustomerPurchaseFrequencyDto } from './application/dtos/customer-purchase-frequency.dto';
import {
  SaleListResponseDto,
  SaleResponseDto,
} from './application/dtos/sale.response.dto';
import {
  CustomerFrequencyResponseDto,
  SaleTransactionsStatsResponseDto,
} from './application/dtos/sale-stats.response.dto';
import {
  ApiBusinessError,
  ApiValidationError,
} from 'src/common/swagger/api-error-responses.decorator';
import { SalesApplicationService } from './application/services/sales.application.service';
import { ActivityLogsApplicationService } from '../activity_logs/application/services/activity-logs.application.service';

@ApiTags('sales')
@ApiBearerAuth('access-token')
@Controller('sales')
export class SalesController {
  constructor(
    private readonly service: SalesApplicationService,
    private loggerService: ActivityLogsApplicationService,
  ) {}

  //#region GET API

  @Get()
  @ApiOperation({ summary: 'Find all sales' })
  @ApiOkResponse({
    description: 'Paginated list of all sales transactions',
    type: SaleListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAll(@Query() query: FindSalesDto): Promise<SaleListResponseDto> {
    return this.service.findAll(query, 'A');
  }

  @Get('regular')
  @ApiOperation({ summary: 'Find all regular sales' })
  @ApiOkResponse({
    description: 'Paginated list of regular (fully paid at purchase) sales',
    type: SaleListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAllRegular(
    @Query() query: FindSalesDto,
  ): Promise<SaleListResponseDto> {
    return this.service.findAll(query, 'R');
  }

  @Get('layaway')
  @ApiOperation({ summary: 'Find all layaway sales' })
  @ApiOkResponse({
    description: 'Paginated list of layaway sales',
    type: SaleListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAllLayaway(
    @Query() query: FindSalesDto,
  ): Promise<SaleListResponseDto> {
    return this.service.findAll(query, 'L');
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Find all overdue layaway sales' })
  @ApiOkResponse({
    description:
      'Paginated list of layaway sales whose current due date has passed without full payment',
    type: SaleListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAllOverdue(
    @Query() query: FindSalesDto,
  ): Promise<SaleListResponseDto> {
    return this.service.findAll(query, 'OD');
  }

  @Get('consigned')
  @ApiOperation({ summary: 'Find all consigned sales' })
  @ApiOkResponse({
    description: 'Paginated list of sales containing consigned products',
    type: SaleListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAllConsigned(
    @Query() query: FindSalesDto,
  ): Promise<SaleListResponseDto> {
    return this.service.findAll(query, 'CN');
  }

  @Get('cancelled')
  @ApiOperation({ summary: 'Find all cancelled sales' })
  @ApiOkResponse({
    description: 'Paginated list of cancelled sales',
    type: SaleListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAllCancelled(
    @Query() query: FindSalesDto,
  ): Promise<SaleListResponseDto> {
    return this.service.findAll(query, 'C');
  }

  @Get('paid')
  @ApiOperation({ summary: 'Find all fully paid sales' })
  @ApiOkResponse({
    description: 'Paginated list of fully paid sales',
    type: SaleListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAllPaid(
    @Query() query: FindSalesDto,
  ): Promise<SaleListResponseDto> {
    return this.service.findAll(query, 'FP');
  }

  @Get('client/:id/transactions')
  @ApiOperation({ summary: 'Find all client sales transactions' })
  @ApiParam({ name: 'id', description: 'External id of the client' })
  @ApiOkResponse({
    description: "Paginated list of the given client's sale transactions",
    type: SaleListResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAllClientTransactions(
    @Param('id') id: string,
    @Query() query: FindSalesDto,
  ): Promise<SaleListResponseDto> {
    return this.service.findAll(query, 'CT', id);
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Find specific sale' })
  @ApiParam({ name: 'id', description: 'External id of the sale transaction' })
  @ApiOkResponse({
    description: 'Sale transaction details',
    type: SaleResponseDto,
  })
  @ApiBusinessError(
    404,
    'Sale transaction, its sold products or payment history not found',
  )
  async findOne(@Param('id') id: string): Promise<SaleResponseDto> {
    return this.service.findOne(id);
  }

  //#endregion

  @Post()
  @ApiOperation({ summary: 'Create sales transaction' })
  @ApiCreatedResponse({
    description:
      'Sale successfully recorded. Regular sales (type R) are fully paid immediately; layaway sales (type L) require a `layaway` plan and an initial deposit lower than or equal to the total amount.',
    type: SaleResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Discount fields missing while `is_discounted` is true, payment greater than total amount due, duplicate products in cart, or insufficient stock',
  )
  @ApiBusinessError(404, 'Client or one of the products not found')
  async create(@Body() dto: SalesDto): Promise<SaleResponseDto> {
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
  @ApiOkResponse({
    description:
      'Payment successfully recorded for a layaway sale. Returns HTTP 200 with `status.success: false` semantics via HTTP 400 when the sale is already fully paid/cancelled or has no outstanding balance.',
    type: SaleResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Sale already fully paid or cancelled, no outstanding balance, or payment greater than the outstanding balance',
  )
  @ApiBusinessError(404, 'Sale not found or not tagged as Layaway')
  async recordPayment(@Body() dto: RecordPaymentDto): Promise<SaleResponseDto> {
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
  @ApiOkResponse({
    description:
      'Sale cancelled and sold quantities returned to stock. The response contains only the status envelope.',
    type: SaleResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    404,
    'Sale not found or already cancelled / sold products not found',
  )
  async cancelSale(@Body() dto: CancelSaleDto): Promise<SaleResponseDto> {
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
  @ApiParam({ name: 'id', description: 'External id of the sale transaction' })
  @ApiOkResponse({
    description: 'Layaway due date successfully extended',
    type: SaleResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Sale already fully paid or cancelled, or new due date is not later than the current due date',
  )
  @ApiBusinessError(
    404,
    'Sale not found, not tagged as Layaway, or layaway plan missing',
  )
  async extendLayawayDueDate(
    @Param('id') id: string,
    @Body() dto: ExtendLayawayDueDateDto,
  ): Promise<SaleResponseDto> {
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
  @ApiOkResponse({
    description:
      'Aggregated sales statistics per status. Without date filters, period breakdowns (today/yesterday/last week/month/year) are included; with date filters only `dataRange` totals are returned.',
    type: SaleTransactionsStatsResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Invalid date range (bad format or `dateFrom` after `dateTo`)',
  )
  async findAllTransactionsStats(
    @Query() query: GetAllSalesTransactionsStats,
  ): Promise<SaleTransactionsStatsResponseDto> {
    return this.service.getSalesStats(query.mode, query.dateFrom, query.dateTo);
  }

  @Get('transaction/frequencies')
  @ApiOperation({ summary: 'Get customer purchase frequencies' })
  @ApiOkResponse({
    description:
      'New vs repeat customer metrics. With dateFrom/dateTo only `customRange` is returned; otherwise predefined periods (thisMonth, lastMonth, last6mos, lastYear) are returned.',
    type: CustomerFrequencyResponseDto,
  })
  @ApiValidationError()
  async getCustomerFrequency(
    @Query() dto: CustomerPurchaseFrequencyDto,
  ): Promise<CustomerFrequencyResponseDto> {
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
