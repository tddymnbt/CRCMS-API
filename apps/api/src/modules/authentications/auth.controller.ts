import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticationsService } from './authentications.service';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { ILoginResponse } from './interface/login.interface';
import { ValidateLoginDto } from './dto/validate-login.dto';
import { IValidateLoginResponse } from './interface/validate-login.interface';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthenticationsService) {}

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<ILoginResponse> {
    const response = await this.authService.login(dto);
    return response;
  }

  @Post('login/verify')
  async loginVerify(
    @Body() dto: ValidateLoginDto,
  ): Promise<IValidateLoginResponse> {
    const response = await this.authService.validateLogin(dto);
    return response;
  }

  @Post('login/resend')
  async loginResend(@Body() dto: LoginDto): Promise<ILoginResponse> {
    const response = await this.authService.login(dto);
    return response;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async revokeToken(@Req() req): Promise<{ message: string }> {
    const accessToken = req.headers.authorization.split(' ')[1];

    await this.authService.deactivateToken(accessToken);

    return {
      message: 'Token revoked successfully',
    };
  }
}
