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

export class RefreshTokenDetailsDto {
  @ApiProperty({
    description:
      'Opaque refresh token. Send it to `POST /auth/refresh` to obtain a new access token. Store securely; it is never logged.',
    example: 'YzJkOWE3ZTQtOGIxZD00Y2M1LWJmMjktZTc4YTQyNzM5YWFhLXhYWHhYWFhY',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Refresh token expiry timestamp (Asia/Manila timezone)',
    example: '2025-06-19 10:15:30',
  })
  refresh_token_expiry: string;
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
    description:
      'Refresh token details. Present only when validation succeeds. Use it to obtain a new access token via `POST /auth/refresh`.',
    type: RefreshTokenDetailsDto,
  })
  refresh?: RefreshTokenDetailsDto;

  @ApiPropertyOptional({
    description: 'Authenticated user. Present only when validation succeeds.',
    type: UserDto,
  })
  data?: UserDto;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ type: ResponseStatusDto })
  status: ResponseStatusDto;

  @ApiProperty({
    description: 'New short-lived access token details',
    type: TokenResponseDto,
  })
  access: TokenResponseDto;

  @ApiProperty({
    description:
      'New rotated refresh token. The previously used refresh token is revoked and cannot be used again.',
    type: RefreshTokenDetailsDto,
  })
  refresh: RefreshTokenDetailsDto;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Result message',
    example: 'Token revoked successfully',
  })
  message: string;
}
