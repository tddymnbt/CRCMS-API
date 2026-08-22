import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOTPLogs } from './domain/entities/otp-logs.entity';
import { UserAuthentications } from './domain/entities/user-auth.entity';
import { UserRefreshTokens } from './domain/entities/user-refresh-tokens.entity';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { EmailService } from 'src/common/email/email.service';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';
import { AuthenticationsApplicationService } from './application/services/authentications.application.service';
import { AUTHENTICATIONS_REPOSITORY } from './domain/repositories/authentications.repository.port';
import { TypeormAuthenticationsRepository } from './infrastructure/repositories/typeorm-authentications.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserOTPLogs,
      UserAuthentications,
      UserRefreshTokens,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            Number(configService.get<string>('JWT_ACCESS_EXPIRES_IN')) || 3600,
        },
      }),
    }),
    UsersModule,
    ActivityLogsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthenticationsApplicationService,
    JwtStrategy,
    EmailService,
    {
      provide: AUTHENTICATIONS_REPOSITORY,
      useClass: TypeormAuthenticationsRepository,
    },
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthenticationsModule {}
