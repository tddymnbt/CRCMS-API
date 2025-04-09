import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interface/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAuthentications } from './entity/user-auth.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserAuthentications)
    private readonly userAuthRepository: Repository<UserAuthentications>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<{ email: string }> {
    if (!payload.jti) {
      throw new UnauthorizedException('Token has been revoked or is invalid');
    }

    const tokenRecord = await this.userAuthRepository.findOne({
      where: { token_jti: payload.jti, is_active: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Token has been revoked or is invalid');
    }

    return { email: payload.email };
  }
}
