import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOTPLogs } from './entity/otp-logs.entity';
import { UserAuthentications } from './entity/user-auth.entity';
import { LoginDto } from './dto/login.dto';
import { generateOTP } from 'src/common/utils/gen-otp';
import { ILoginResponse } from './interface/login.interface';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ValidateLoginDto } from './dto/validate-login.dto';
import {
  IAuthEntry,
  ITokenResponse,
} from './interface/token-response.interface';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { JwtPayload } from './interface/jwt-payload.interface';
import { formatInTimeZone } from 'date-fns-tz';
import { IValidateLoginResponse } from './interface/validate-login.interface';
import { EmailService } from 'src/common/email/email.service';

@Injectable()
export class AuthenticationsService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly emailService: EmailService,

    @InjectRepository(UserOTPLogs)
    private readonly otpRepo: Repository<UserOTPLogs>,

    @InjectRepository(UserAuthentications)
    private readonly authRepo: Repository<UserAuthentications>,
  ) {}

  async login(dto: LoginDto): Promise<ILoginResponse> {
    const user = await this.usersService.findOneByEmail(dto.email);

    const otp = generateOTP(6);
    const otpLog = this.otpRepo.create({
      email: dto.email,
      otp,
      date_requested: new Date(),
      is_used: false,
      is_expired: false,
    });
    await this.otpRepo.save(otpLog);

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


    return {
      status: { success: true, message: 'Email sent' },
    };
  }

  async validateLogin(dto: ValidateLoginDto): Promise<IValidateLoginResponse> {
    const user = await this.usersService.findOneByEmail(dto.email);

    const otpRecord = await this.otpRepo.findOne({
      where: {
        email: dto.email,
        otp: dto.otp,
        is_used: false,
        is_expired: false,
      },
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
      await this.otpRepo.save(otpRecord);
      return { status: { success: false, message: 'OTP has expired.' } };
    }

    otpRecord.is_used = true;
    otpRecord.date_validated = new Date();
    await this.otpRepo.save(otpRecord);

    const token = await this.generateAndSaveToken(
      dto.email,
      user.data.external_id,
    );

    delete user.data.id;

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

    const authEntry: IAuthEntry = this.authRepo.create({
      created_by: userExtId,
      is_active: true,
      token: token,
      token_expiry: tokenExpiry,
      user_ext_id: userExtId,
      token_jti: jti,
    });

    await this.authRepo.save(authEntry);

    return { token, tokenExpiry };
  }

  async deactivateToken(token: string): Promise<void> {
    await this.authRepo.update({ token: token }, { is_active: false });
  }
}
