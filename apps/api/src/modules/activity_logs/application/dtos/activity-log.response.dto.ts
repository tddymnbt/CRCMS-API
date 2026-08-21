import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginationMetaDto,
  ResponseStatusDto,
} from 'src/common/swagger/response-common.dto';

export class ActivityLogItemDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    description: 'External id of the user who performed the action',
    example: 'uX9kQ2mVzR',
  })
  user_ext_id: string;

  @ApiProperty({
    description: 'Full name of the user who performed the action',
    example: 'John Doe',
  })
  user_name: string;

  @ApiPropertyOptional({
    description: 'Module where the action was performed',
    example: 'Users',
  })
  module?: string;

  @ApiPropertyOptional({
    description: 'Action performed',
    example: 'create',
  })
  action?: string;

  @ApiPropertyOptional({
    description: 'Human-readable description of the action',
    example: 'Created user John Doe',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'External id of the affected record',
    example: 'uX9kQ2mVzR',
  })
  ref_id?: string;

  @ApiProperty({ example: '2025-06-01T08:30:00.000Z' })
  created_at: Date;
}

export class ActivityLogListResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiProperty({ type: [ActivityLogItemDto] })
  data: ActivityLogItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
