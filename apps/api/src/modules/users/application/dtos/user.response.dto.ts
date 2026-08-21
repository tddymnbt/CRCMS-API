import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseStatusDto } from 'src/common/swagger/response-common.dto';
import { PaginationMetaDto } from 'src/common/swagger/response-common.dto';

export class UserRoleDto {
  @ApiProperty({
    description: 'Role identifier',
    example: '2',
  })
  id: string;

  @ApiProperty({
    description: 'Role name',
    example: 'Staff',
  })
  name: string;
}

/**
 * User record as returned by all user endpoints.
 */
export class UserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({
    description: 'Public unique identifier of the user',
    example: 'uX9kQ2mVzR',
  })
  external_id: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  last_name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({
    description: 'Whether the user account is active',
    example: true,
  })
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
    description: 'Last login timestamp (Asia/Manila format)',
    example: 'Jun 12, 2025, 09:15:30 AM',
  })
  last_login?: string;

  @ApiPropertyOptional({
    description: 'First role assigned to the user',
    type: UserRoleDto,
  })
  role?: UserRoleDto;
}

export class UserResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: UserDto })
  data?: UserDto;
}

export class UserListResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({ type: [UserDto] })
  data?: UserDto[];

  @ApiPropertyOptional({ type: PaginationMetaDto })
  meta?: PaginationMetaDto;
}
