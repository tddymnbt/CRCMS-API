import { UserOTPLogs } from '../entities/otp-logs.entity';
import { UserAuthentications } from '../entities/user-auth.entity';

export const AUTHENTICATIONS_REPOSITORY = Symbol('AUTHENTICATIONS_REPOSITORY');

export interface OtpLogFilter {
  email: string;
  otp: string;
  token: string;
}

export interface AuthenticationsRepositoryPort {
  createOtpLog(payload: Partial<UserOTPLogs>): UserOTPLogs;
  saveOtpLog(otpLog: UserOTPLogs): Promise<UserOTPLogs>;
  findOtpLog(filter: OtpLogFilter): Promise<UserOTPLogs | null>;
  createUserAuth(payload: Partial<UserAuthentications>): UserAuthentications;
  saveUserAuth(auth: UserAuthentications): Promise<UserAuthentications>;
  deactivateToken(token: string): Promise<void>;
  findActiveAuthByJti(jti: string): Promise<UserAuthentications | null>;
}
