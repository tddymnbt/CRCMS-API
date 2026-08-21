import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOTPLogs } from '../../domain/entities/otp-logs.entity';
import { UserAuthentications } from '../../domain/entities/user-auth.entity';
import {
  AuthenticationsRepositoryPort,
  OtpLogFilter,
} from '../../domain/repositories/authentications.repository.port';

@Injectable()
export class TypeormAuthenticationsRepository
  implements AuthenticationsRepositoryPort
{
  constructor(
    @InjectRepository(UserOTPLogs)
    private readonly otpRepo: Repository<UserOTPLogs>,

    @InjectRepository(UserAuthentications)
    private readonly authRepo: Repository<UserAuthentications>,
  ) {}

  createOtpLog(payload: Partial<UserOTPLogs>): UserOTPLogs {
    return this.otpRepo.create(payload);
  }

  saveOtpLog(otpLog: UserOTPLogs): Promise<UserOTPLogs> {
    return this.otpRepo.save(otpLog);
  }

  findOtpLog(filter: OtpLogFilter): Promise<UserOTPLogs | null> {
    return this.otpRepo.findOne({
      where: {
        email: filter.email,
        otp: filter.otp,
        token: filter.token,
        is_used: false,
        is_expired: false,
      },
    });
  }

  createUserAuth(payload: Partial<UserAuthentications>): UserAuthentications {
    return this.authRepo.create(payload);
  }

  saveUserAuth(auth: UserAuthentications): Promise<UserAuthentications> {
    return this.authRepo.save(auth);
  }

  async deactivateToken(token: string): Promise<void> {
    await this.authRepo.update({ token: token }, { is_active: false });
  }

  findActiveAuthByJti(jti: string): Promise<UserAuthentications | null> {
    return this.authRepo.findOne({
      where: { token_jti: jti, is_active: true },
    });
  }
}
