import { Module } from '@nestjs/common';
import { AuthenticationsService } from './authentications.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOTPLogs } from './entity/otp-logs.entity';
import { UserAuthentications } from './entity/user-auth.entity';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOTPLogs, UserAuthentications]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: 3600 },
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthenticationsService, JwtStrategy],
  exports: [JwtStrategy, PassportModule],
})
export class AuthenticationsModule {}
