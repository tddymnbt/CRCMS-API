import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticationsService } from './authentications.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { ILoginResponse } from './interface/login.interface';
import { ValidateLoginDto } from './dto/validate-login.dto';
import { IValidateLoginResponse } from './interface/validate-login.interface';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { ActivityLogsService } from '../activity_logs/activity_logs.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthenticationsService,
    private loggerService: ActivityLogsService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  async login(@Body() dto: LoginDto): Promise<ILoginResponse> {
    const response = await this.authService.login(dto);
    return response;
  }

  @Post('login/verify')
  @ApiOperation({ summary: 'Verify login using OTP' })
  async loginVerify(
    @Body() dto: ValidateLoginDto,
  ): Promise<IValidateLoginResponse> {
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
  async loginResend(@Body() dto: LoginDto): Promise<ILoginResponse> {
    const response = await this.authService.login(dto);
    return response;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  @UseGuards(JwtAuthGuard)
  async revokeToken(@Req() req): Promise<{ message: string }> {
    const accessToken = req.headers.authorization.split(' ')[1];

    await this.authService.deactivateToken(accessToken);

    return {
      message: 'Token revoked successfully',
    };
  }
}
