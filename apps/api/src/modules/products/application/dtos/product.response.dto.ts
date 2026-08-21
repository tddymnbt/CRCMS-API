import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginationMetaDto,
  ResponseStatusDto,
} from 'src/common/swagger/response-common.dto';

export class ProductCategoryRefDto {
  @ApiProperty({
    description: 'Category external id',
    example: 'catH4ndBag01',
  })
  code: string;

  @ApiProperty({ example: 'Handbag' })
  name: string;
}

export class ProductBrandRefDto {
  @ApiProperty({
    description: 'Brand external id',
    example: 'bR4nD001Xy',
  })
  code: string;

  @ApiProperty({ example: 'Louis Vuitton' })
  name: string;
}

export class ProductAuthenticatorRefDto {
  @ApiProperty({
    description: 'Authenticator external id',
    example: 'aUtH001Xyz',
  })
  code: string;

  @ApiProperty({ example: 'Zalu Corp' })
  name: string;
}

export class ProductConditionDetailsDto {
  @ApiProperty({ example: '9.8/10' })
  interior: string;

  @ApiProperty({
    example: '9.8/10 (Plastic films intact on hardware feet)',
  })
  exterior: string;

  @ApiProperty({ example: '98% - Like New Condition' })
  overall: string;

  @ApiPropertyOptional({ example: 'Minor scuffing on base studs' })
  description?: string;
}

export class ProductStockDetailsDto {
  @ApiProperty({ example: 2 })
  min_qty: number;

  @ApiProperty({ example: 10 })
  qty_in_stock: number;

  @ApiProperty({ example: 3 })
  sold_stock: number;
}

export class ProductConsignorDto {
  @ApiProperty({
    description: 'Consignor client external id',
    example: 'cX7tR2wK9p',
  })
  code: string;

  @ApiProperty({ example: 'Juan' })
  first_name: string;

  @ApiProperty({ example: 'Dela Cruz' })
  last_name: string;
}

/**
 * Product record as returned by all product endpoints.
 */
export class ProductDto {
  @ApiProperty({
    description: 'Stock record external id',
    example: 'stXk0001Ab',
  })
  stock_external_id: string;

  @ApiProperty({
    description: 'Product record external id',
    example: 'pRd00001Cd',
  })
  product_external_id: string;

  @ApiProperty({ type: ProductCategoryRefDto })
  category: ProductCategoryRefDto;

  @ApiProperty({ type: ProductBrandRefDto })
  brand: ProductBrandRefDto;

  @ApiProperty({ example: 'Neverfull MM Monogram' })
  name: string;

  @ApiProperty({ example: 'Leather' })
  material: string;

  @ApiProperty({ example: 'Gold-tone metal' })
  hardware: string;

  @ApiProperty({ example: 'PRD123' })
  code: string;

  @ApiProperty({ example: '32 x 29 x 17 cm' })
  measurement: string;

  @ApiProperty({ example: 'Model-X' })
  model: string;

  @ApiProperty({ type: ProductAuthenticatorRefDto })
  authenticator: ProductAuthenticatorRefDto;

  @ApiProperty({ type: [String], example: ['Dust bag', 'Box'] })
  inclusions: string[];

  @ApiProperty({ type: [String], example: ['img1.jpg', 'img2.jpg'] })
  images: string[];

  @ApiProperty({ type: ProductConditionDetailsDto })
  condition: ProductConditionDetailsDto;

  @ApiProperty({ example: 100 })
  cost: number;

  @ApiProperty({ example: 150 })
  price: number;

  @ApiProperty({ type: ProductStockDetailsDto })
  stock: ProductStockDetailsDto;

  @ApiProperty({
    description: 'Whether the product is on consignment',
    example: false,
  })
  is_consigned: boolean;

  @ApiPropertyOptional({ type: ProductConsignorDto })
  consignor?: ProductConsignorDto;

  @ApiPropertyOptional({ example: 140 })
  consignor_selling_price?: number;

  @ApiPropertyOptional({ example: '2025-06-01T00:00:00.000Z' })
  consigned_date?: Date;

  @ApiProperty({ example: '2025-06-01T08:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: 'admin_user' })
  created_by: string;

  @ApiPropertyOptional({ example: '2025-06-10T14:05:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ example: 'admin_user' })
  updated_by?: string;

  @ApiPropertyOptional({ example: null })
  deleted_at?: Date;

  @ApiPropertyOptional({ example: null })
  deleted_by?: string;
}

export class ProductResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: ProductDto })
  data?: ProductDto;
}

export class ProductListResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: [ProductDto] })
  data?: ProductDto[];

  @ApiPropertyOptional({ type: PaginationMetaDto })
  meta?: PaginationMetaDto;
}

export class ProductTransactionDto {
  @ApiProperty({
    description: 'Stock record external id',
    example: 'stXk0001Ab',
  })
  stock_id: string;

  @ApiProperty({
    description: 'Product record external id',
    example: 'pRd00001Cd',
  })
  product_id: string;

  @ApiProperty({
    description: 'Movement type',
    example: 'sale',
  })
  type: string;

  @ApiProperty({
    description:
      'Movement source (e.g. manual stock update or sale transaction)',
    example: 'S-aBcDeFgHiJ',
  })
  source: string;

  @ApiProperty({ example: 10 })
  qty_before: number;

  @ApiProperty({ example: -1 })
  change: number;

  @ApiProperty({ example: 9 })
  qty_after: number;

  @ApiProperty({ example: 'Ok' })
  status: string;

  @ApiProperty({ example: 'admin_user' })
  performed_by: string;
}

export class ProductTransactionListResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: [ProductTransactionDto] })
  data?: ProductTransactionDto[];

  @ApiPropertyOptional({ type: PaginationMetaDto })
  meta?: PaginationMetaDto;
}
