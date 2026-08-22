import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticationsApplicationService } from './application/services/authentications.application.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './application/dtos/login.dto';
import { ValidateLoginDto } from './application/dtos/validate-login.dto';
import { RefreshTokenDto } from './application/dtos/refresh-token.dto';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import {
  LoginResponseDto,
  LogoutResponseDto,
  RefreshTokenResponseDto,
  ValidateLoginResponseDto,
} from './application/dtos/auth.response.dto';
import {
  ApiBusinessError,
  ApiValidationError,
} from 'src/common/swagger/api-error-responses.decorator';
import { BusinessErrorResponseDto } from 'src/common/swagger/error-response.dto';
import { ActivityLogsApplicationService } from '../activity_logs/application/services/activity-logs.application.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthenticationsApplicationService,
    private loggerService: ActivityLogsApplicationService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({
    description:
      'OTP request accepted. The same response is returned whether or not the email is registered. A valid OTP is sent by email when the account exists.',
    type: LoginResponseDto,
  })
  @ApiValidationError()
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const response = await this.authService.login(dto);
    return response;
  }

  @Post('login/verify')
  @ApiOperation({ summary: 'Verify login using OTP' })
  @ApiOkResponse({
    description:
      'Returns the authenticated user, a short-lived access token and a refresh token on success. Use the refresh token with `POST /auth/refresh` when the access token expires. When the OTP is invalid/expired the endpoint still returns HTTP 200 with `status.success: false` and no `access`/`refresh`/`data` payload.',
    type: ValidateLoginResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(404, 'User not found after successful OTP validation')
  async loginVerify(
    @Body() dto: ValidateLoginDto,
  ): Promise<ValidateLoginResponseDto> {
    const response = await this.authService.validateLogin(dto);

    if (dto.email !== 'lwphtestemail@yopmail.com' && response.status.success) {
      this.loggerService.log(
        response.data.external_id,
        'Authentication',
        'login',
        'Login',
      );
    }

    return response;
  }

  @Post('login/resend')
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiOkResponse({
    description:
      'Generates a new OTP and one-time token for the given email. The previous token becomes unusable.',
    type: LoginResponseDto,
  })
  @ApiValidationError()
  async loginResend(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const response = await this.authService.login(dto);
    return response;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchanges a valid, non-revoked and non-expired refresh token for a new short-lived access token. The presented refresh token is rotated (revoked) and a new refresh token is returned. Reusing a rotated refresh token revokes every active session of the user.',
  })
  @ApiOkResponse({
    description: 'Returns a new access token and a new rotated refresh token.',
    type: RefreshTokenResponseDto,
  })
  @ApiValidationError()
  @ApiUnauthorizedResponse({
    description:
      'Missing/invalid/expired/revoked refresh token, reuse of a rotated refresh token (all sessions revoked), or inactive user',
    type: BusinessErrorResponseDto,
  })
  @ApiBusinessError(
    404,
    'User associated with the refresh token no longer exists',
  )
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Access token successfully revoked',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, expired or revoked bearer token',
  })
  @UseGuards(JwtAuthGuard)
  async revokeToken(@Req() req): Promise<LogoutResponseDto> {
    const accessToken = req.headers.authorization.split(' ')[1];

    await this.authService.deactivateToken(accessToken);

    return {
      message: 'Token revoked successfully',
    };
  }
}
