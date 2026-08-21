import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginationMetaDto,
  ResponseStatusDto,
} from 'src/common/swagger/response-common.dto';

export class ClientBankDetailsDto {
  @ApiProperty({ example: 'TESTACCOUNT001' })
  account_name: string;

  @ApiProperty({ example: '1234657890123' })
  account_no: string;

  @ApiPropertyOptional({ example: 'BPI' })
  bank?: string;
}

/**
 * Client record as returned by all client endpoints.
 */
export class ClientDto {
  @ApiProperty({
    description: 'Public unique identifier of the client',
    example: 'cX7tR2wK9p',
  })
  external_id: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiPropertyOptional({ example: 'Marquez' })
  middle_name?: string;

  @ApiProperty({ example: 'Cruz' })
  last_name: string;

  @ApiPropertyOptional({ example: 'Jr.' })
  suffix?: string;

  @ApiProperty({ example: '1999-04-01T00:00:00.000Z' })
  birth_date: Date;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '09123456789' })
  contact_no?: string;

  @ApiPropertyOptional({
    example: 'Block 1, Street 2, Somewhere, City, Province',
  })
  address?: string;

  @ApiPropertyOptional({ example: 'https://www.instagram.com/test' })
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://www.facebook.com/test' })
  facebook?: string;

  @ApiProperty({
    description: 'Whether the client is tagged as a consignor',
    example: false,
  })
  is_consignor: boolean;

  @ApiProperty({ description: 'Whether the client is active', example: true })
  is_active: boolean;

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

  @ApiPropertyOptional({
    description: 'Bank details. Present for consignors.',
    type: ClientBankDetailsDto,
  })
  bank?: ClientBankDetailsDto;
}

export class ClientResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: ClientDto })
  data?: ClientDto;
}

export class ClientListResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: [ClientDto] })
  data?: ClientDto[];

  @ApiPropertyOptional({ type: PaginationMetaDto })
  meta?: PaginationMetaDto;
}
