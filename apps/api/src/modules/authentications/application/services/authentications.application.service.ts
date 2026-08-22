import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../../application/dtos/login.dto';
import { generateOTP } from 'src/common/utils/gen-otp';
import { ILoginResponse } from '../../application/interfaces/login.interface';
import { UsersApplicationService } from '../../../users/application/services/users.application.service';
import { JwtService } from '@nestjs/jwt';
import { ValidateLoginDto } from '../../application/dtos/validate-login.dto';
import {
  IRefreshTokenResponse,
  ITokenResponse,
} from '../../application/interfaces/token-response.interface';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { JwtPayload } from '../../application/interfaces/jwt-payload.interface';
import { formatInTimeZone } from 'date-fns-tz';
import { IValidateLoginResponse } from '../../application/interfaces/validate-login.interface';
import { EmailService } from 'src/common/email/email.service';
import { RefreshTokenDto } from '../../application/dtos/refresh-token.dto';
import { createHash, randomBytes } from 'crypto';
import {
  AUTHENTICATIONS_REPOSITORY,
  AuthenticationsRepositoryPort,
} from '../../domain/repositories/authentications.repository.port';

const PHT_TIMEZONE = 'Asia/Manila';

@Injectable()
export class AuthenticationsApplicationService {
  constructor(
    private usersService: UsersApplicationService,
    private jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,

    @Inject(AUTHENTICATIONS_REPOSITORY)
    private readonly authenticationsRepository: AuthenticationsRepositoryPort,
  ) {}

  async login(dto: LoginDto): Promise<ILoginResponse> {
    const user = await this.usersService.findOneByEmail(dto.email);

    const otp = generateOTP(6);
    const token = generateUniqueId(36);

    if (user.status.success) {
      const otpLog = this.authenticationsRepository.createOtpLog({
        email: dto.email,
        token,
        otp,
        date_requested: new Date(),
        is_used: false,
        is_expired: false,
      });
      await this.authenticationsRepository.saveOtpLog(otpLog);

      // Send OTP via email logic here (skipped for brevity)
      const templateData = {
        OTP: otp,
      };
      const subject = `${user.data.first_name} ${user.data.last_name} - One-Time Password`;
      const template = 'otp-template';
      await this.emailService.sendEmail(
        templateData,
        template,
        dto.email,
        subject,
      );
    }

    return {
      status: {
        success: true,
        message: 'If the email exists, an OTP will be sent shortly.',
        token,
      },
    };
  }

  async validateLogin(dto: ValidateLoginDto): Promise<IValidateLoginResponse> {
    const otpRecord = await this.authenticationsRepository.findOtpLog({
      email: dto.email,
      otp: dto.otp,
      token: dto.token,
    });

    if (!otpRecord) {
      return {
        status: { success: false, message: 'Invalid OTP or OTP has expired.' },
      };
    }

    const currentTime = new Date();
    const otpTime = new Date(otpRecord.date_requested);
    const timeDifferenceInMinutes =
      (currentTime.getTime() - otpTime.getTime()) / 60000;

    if (timeDifferenceInMinutes > 5) {
      otpRecord.is_expired = true;
      await this.authenticationsRepository.saveOtpLog(otpRecord);
      return { status: { success: false, message: 'OTP has expired.' } };
    }

    otpRecord.is_used = true;
    otpRecord.date_validated = new Date();
    await this.authenticationsRepository.saveOtpLog(otpRecord);

    const user = await this.usersService.findOneByEmail(dto.email);
    if (!user.status.success) {
      throw new NotFoundException({
        status: { success: false, message: 'User not found.' },
      });
    }

    const token = await this.generateAndSaveToken(
      dto.email,
      user.data.external_id,
    );

    const refresh = await this.issueRefreshToken(user.data.external_id);

    delete user.data.id;
    const lastLoginVal = await this.usersService.updateLastDateLogin(dto.email);
    user.data.last_login = lastLoginVal;

    return {
      status: { success: true, message: 'Successfully validated' },
      access: token,
      refresh: refresh,
      data: user.data,
    };
  }

  async generateAndSaveToken(
    email: string,
    userExtId: string,
  ): Promise<ITokenResponse> {
    const jti = generateUniqueId(10);

    const payload: JwtPayload = { email: email, jti: jti };
    const token = this.jwtService.sign(payload);

    const accessTtlSeconds = this.getAccessTokenTtlSeconds();
    const utcExpiry = new Date(Date.now() + accessTtlSeconds * 1000);
    const tokenExpiry = formatInTimeZone(
      utcExpiry,
      PHT_TIMEZONE,
      'yyyy-MM-dd HH:mm:ss',
    );

    const authEntry = this.authenticationsRepository.createUserAuth({
      created_by: userExtId,
      is_active: true,
      token: token,
      token_expiry: tokenExpiry,
      user_ext_id: userExtId,
      token_jti: jti,
    });

    await this.authenticationsRepository.saveUserAuth(authEntry);

    return { token, tokenExpiry };
  }

  async deactivateToken(token: string): Promise<void> {
    await this.authenticationsRepository.deactivateToken(token);
  }

  async refresh(dto: RefreshTokenDto): Promise<{
    status: { success: boolean; message: string };
    access: ITokenResponse;
    refresh: IRefreshTokenResponse;
  }> {
    const tokenHash = this.hashRefreshToken(dto.refresh_token);
    const storedToken =
      await this.authenticationsRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException({
        status: { success: false, message: 'Invalid refresh token.' },
      });
    }

    if (storedToken.revoked_at) {
      if (storedToken.rotated_at) {
        // Reuse of a rotated token is treated as a possible token theft:
        // revoke every active refresh token issued to this user.
        await this.authenticationsRepository.revokeAllActiveRefreshTokens(
          storedToken.user_ext_id,
        );
        throw new UnauthorizedException({
          status: {
            success: false,
            message:
              'Refresh token has already been used. All sessions have been revoked.',
          },
        });
      }

      throw new UnauthorizedException({
        status: { success: false, message: 'Refresh token has been revoked.' },
      });
    }

    if (new Date(storedToken.expires_at).getTime() <= Date.now()) {
      throw new UnauthorizedException({
        status: { success: false, message: 'Refresh token has expired.' },
      });
    }

    const user = await this.usersService.findOne(storedToken.user_ext_id);

    if (!user.data.is_active) {
      throw new UnauthorizedException({
        status: {
          success: false,
          message: 'User account is inactive or unauthorized.',
        },
      });
    }

    // Rotate: invalidate the presented token before issuing a new one.
    storedToken.revoked_at = new Date();
    storedToken.rotated_at = new Date();
    await this.authenticationsRepository.saveUserRefreshToken(storedToken);

    const access = await this.generateAndSaveToken(
      user.data.email,
      user.data.external_id,
    );
    const refresh = await this.issueRefreshToken(user.data.external_id);

    return {
      status: { success: true, message: 'Successfully refreshed' },
      access,
      refresh,
    };
  }

  private async issueRefreshToken(
    userExtId: string,
  ): Promise<IRefreshTokenResponse> {
    const refreshToken = randomBytes(48).toString('base64url');
    const ttlSeconds = this.getRefreshTokenTtlSeconds();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const refreshTokenExpiry = formatInTimeZone(
      expiresAt,
      PHT_TIMEZONE,
      'yyyy-MM-dd HH:mm:ss',
    );

    const refreshEntry = this.authenticationsRepository.createUserRefreshToken({
      created_by: userExtId,
      token_hash: this.hashRefreshToken(refreshToken),
      expires_at: expiresAt,
      user_ext_id: userExtId,
    });

    await this.authenticationsRepository.saveUserRefreshToken(refreshEntry);

    return {
      refresh_token: refreshToken,
      refresh_token_expiry: refreshTokenExpiry,
    };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getAccessTokenTtlSeconds(): number {
    return (
      Number(this.configService.get<string>('JWT_ACCESS_EXPIRES_IN')) || 3600
    );
  }

  private getRefreshTokenTtlSeconds(): number {
    return (
      Number(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')) || 604800
    );
  }
}
