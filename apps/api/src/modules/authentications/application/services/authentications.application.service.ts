import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LoginDto } from '../../application/dtos/login.dto';
import { generateOTP } from 'src/common/utils/gen-otp';
import { ILoginResponse } from '../../application/interfaces/login.interface';
import { UsersApplicationService } from '../../../users/application/services/users.application.service';
import { JwtService } from '@nestjs/jwt';
import { ValidateLoginDto } from '../../application/dtos/validate-login.dto';
import { ITokenResponse } from '../../application/interfaces/token-response.interface';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { JwtPayload } from '../../application/interfaces/jwt-payload.interface';
import { formatInTimeZone } from 'date-fns-tz';
import { IValidateLoginResponse } from '../../application/interfaces/validate-login.interface';
import { EmailService } from 'src/common/email/email.service';
import {
  AUTHENTICATIONS_REPOSITORY,
  AuthenticationsRepositoryPort,
} from '../../domain/repositories/authentications.repository.port';

@Injectable()
export class AuthenticationsApplicationService {
  constructor(
    private usersService: UsersApplicationService,
    private jwtService: JwtService,
    private readonly emailService: EmailService,

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

    delete user.data.id;
    const lastLoginVal = await this.usersService.updateLastDateLogin(dto.email);
    user.data.last_login = lastLoginVal;

    return {
      status: { success: true, message: 'Successfully validated' },
      access: token,
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

    const utcExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const phtTimeZone = 'Asia/Manila';
    const tokenExpiry = formatInTimeZone(
      utcExpiry,
      phtTimeZone,
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
}
