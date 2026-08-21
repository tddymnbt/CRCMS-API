import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginationMetaDto,
  ResponseStatusDto,
} from 'src/common/swagger/response-common.dto';

export class SaleCustomerDto {
  @ApiProperty({
    description: 'Client external id',
    example: 'cX7tR2wK9p',
  })
  external_id: string;

  @ApiProperty({
    description: 'Full name of the client',
    example: 'John Cruz',
  })
  name: string;
}

export class SaleTypeDto {
  @ApiProperty({
    description: 'Sale type code',
    enum: ['R', 'L'],
    example: 'L',
  })
  code: string;

  @ApiProperty({
    description: 'Sale type description',
    example: 'Layaway',
  })
  description: string;
}

export class SaleLayawayPlanDto {
  @ApiProperty({
    description: 'Whether the current due date has passed without full payment',
    example: false,
  })
  is_overdue: boolean;

  @ApiProperty({ example: '6' })
  no_of_months: string;

  @ApiProperty({
    description: 'Remaining amount due (2 decimal places)',
    example: '5000.00',
  })
  amount_due: string;

  @ApiProperty({ example: '2025-10-01T00:00:00.000Z' })
  current_due_date: Date;

  @ApiProperty({ example: '2025-10-01T00:00:00.000Z' })
  orig_due_date: Date;

  @ApiProperty({
    description: 'Whether the due date was extended at least once',
    example: false,
  })
  is_extended: boolean;

  @ApiProperty({
    description: 'Layaway payment status',
    enum: ['Unpaid', 'Paid'],
    example: 'Unpaid',
  })
  status: string;
}

export class SaleProductUnitDto {
  @ApiProperty({
    description: 'Product stock external id',
    example: 'stXk0001Ab',
  })
  external_id: string;

  @ApiProperty({ example: 'Neverfull MM Monogram' })
  name: string;

  @ApiProperty({ example: 'PRD123' })
  code: string;

  @ApiProperty({ type: [String], example: ['Dust bag', 'Box'] })
  inclusions: string[];

  @ApiProperty({ example: false })
  is_consigned: boolean;

  @ApiProperty({
    description: 'Unit price at time of sale (2 decimal places)',
    example: '150.00',
  })
  unit_price: string;

  @ApiProperty({ example: 1 })
  qty: number;

  @ApiProperty({
    description: 'Line subtotal (2 decimal places)',
    example: '150.00',
  })
  subtotal: string;
}

export class SalePaymentHistoryDto {
  @ApiProperty({
    description: 'Payment log external id',
    example: 'PaYl0g0001',
  })
  external_id: string;

  @ApiProperty({
    description: 'Amount paid (2 decimal places)',
    example: '10000.00',
  })
  amount: string;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  payment_date: Date;

  @ApiProperty({ example: 'Cash' })
  payment_method: string;
}

/**
 * Sale transaction record as returned by all sale endpoints.
 */
export class SaleRecordDto {
  @ApiProperty({
    description: 'Sale transaction external id',
    example: 'S-aBcDeFgHiJ',
  })
  sale_external_id: string;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  date_purchased: Date;

  @ApiProperty({ type: SaleCustomerDto })
  Customer: SaleCustomerDto;

  @ApiProperty({ type: SaleTypeDto })
  type: SaleTypeDto;

  @ApiPropertyOptional({
    description:
      'Layaway plan details. Present only for layaway (type L) transactions.',
    type: SaleLayawayPlanDto,
  })
  layaway_plan?: SaleLayawayPlanDto;

  @ApiProperty({ type: [SaleProductUnitDto] })
  product: SaleProductUnitDto[];

  @ApiProperty({
    description: 'Total transaction amount after discounts (2 decimal places)',
    example: '10150.00',
  })
  total_amount: string;

  @ApiProperty({
    description: 'Remaining balance across all payments (2 decimal places)',
    example: '150.00',
  })
  outstanding_balance: string;

  @ApiProperty({ example: false })
  is_discounted: boolean;

  @ApiProperty({ example: '0.00' })
  discount_percent: string;

  @ApiProperty({ example: '0.00' })
  discount_flat_rate: string;

  @ApiProperty({
    description: 'Sale status',
    enum: ['Fully paid', 'Deposit', 'Cancelled'],
    example: 'Deposit',
  })
  status: string;

  @ApiProperty({ type: [SalePaymentHistoryDto] })
  payment_history: SalePaymentHistoryDto[];

  @ApiProperty({ type: [String], example: ['img1.jpg'] })
  images: string[];

  @ApiProperty({ example: '2025-06-01T08:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: 'admin_user' })
  created_by: string;

  @ApiPropertyOptional({
    description: 'Cancellation timestamp. Null unless the sale was cancelled.',
    example: null,
  })
  cancelled_at?: Date;

  @ApiPropertyOptional({
    description: 'User who cancelled the sale. Null unless cancelled.',
    example: null,
  })
  cancelled_by?: string;
}

export class SaleResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: SaleRecordDto })
  data?: SaleRecordDto;
}

export class SaleListResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: [SaleRecordDto] })
  data?: SaleRecordDto[];

  @ApiPropertyOptional({ type: PaginationMetaDto })
  meta?: PaginationMetaDto;
}
