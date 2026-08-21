import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseStatusDto } from 'src/common/swagger/response-common.dto';
import { UserDto } from 'src/modules/users/application/dtos/user.response.dto';

export class LoginStatusDto {
  @ApiProperty({
    description: 'Whether the OTP request was processed',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Result message',
    example: 'If the email exists, an OTP will be sent shortly.',
  })
  message: string;

  @ApiProperty({
    description:
      'One-time token required to submit the OTP via login/verify or login/resend',
    example: '8fJ2kR9sTq1LmZ4xV7bN3pW6yH0cA5dE',
  })
  token: string;
}

export class LoginResponseDto {
  @ApiProperty({ type: LoginStatusDto })
  status: LoginStatusDto;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token. Use as `Authorization: Bearer <token>`',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<payload>.<signature>',
  })
  token: string;

  @ApiProperty({
    description: 'Token expiry timestamp (Asia/Manila timezone)',
    example: '2025-06-12 10:15:30',
  })
  tokenExpiry: string;
}

export class ValidateLoginResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiPropertyOptional({
    description: 'Access token details. Present only when validation succeeds.',
    type: TokenResponseDto,
  })
  access?: TokenResponseDto;

  @ApiPropertyOptional({
    description: 'Authenticated user. Present only when validation succeeds.',
    type: UserDto,
  })
  data?: UserDto;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Result message',
    example: 'Token revoked successfully',
  })
  message: string;
}
