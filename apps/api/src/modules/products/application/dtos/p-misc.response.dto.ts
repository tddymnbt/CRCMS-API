import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginationMetaDto,
  ResponseStatusDto,
} from 'src/common/swagger/response-common.dto';

/**
 * Product brand/category/authenticator record as returned by the
 * brands, categories and authenticators endpoints.
 */
export class ProductMiscDto {
  @ApiProperty({
    description: 'Public unique identifier',
    example: 'bR4nD001Xy',
  })
  external_id: string;

  @ApiProperty({ example: 'Louis Vuitton' })
  name: string;

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

export class ProductMiscResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: ProductMiscDto })
  data?: ProductMiscDto;
}

export class ProductMiscListResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: [ProductMiscDto] })
  data?: ProductMiscDto[];

  @ApiPropertyOptional({ type: PaginationMetaDto })
  meta?: PaginationMetaDto;
}
