import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './application/interfaces/jwt-payload.interface';
import {
  AUTHENTICATIONS_REPOSITORY,
  AuthenticationsRepositoryPort,
} from './domain/repositories/authentications.repository.port';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(AUTHENTICATIONS_REPOSITORY)
    private readonly authenticationsRepository: AuthenticationsRepositoryPort,
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

    const tokenRecord =
      await this.authenticationsRepository.findActiveAuthByJti(payload.jti);

    if (!tokenRecord) {
      throw new UnauthorizedException('Token has been revoked or is invalid');
    }

    return { email: payload.email };
  }
}
