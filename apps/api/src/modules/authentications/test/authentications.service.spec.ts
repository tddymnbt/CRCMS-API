import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthenticationsApplicationService } from '../application/services/authentications.application.service';
import { UsersApplicationService } from '../../users/application/services/users.application.service';
import { EmailService } from 'src/common/email/email.service';
import { AUTHENTICATIONS_REPOSITORY } from '../domain/repositories/authentications.repository.port';
import { RefreshTokenDto } from '../application/dtos/refresh-token.dto';

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
describe('AuthenticationsApplicationService - refresh token flow', () => {
  let service: AuthenticationsApplicationService;
  let authenticationsRepository: Record<string, jest.Mock>;
  let usersService: { findOne: jest.Mock };

  const rawToken = 'raw-refresh-token-value';

  const buildStoredToken = (
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> => ({
    id: 1,
    user_ext_id: 'usr-123',
    token_hash: sha256(rawToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revoked_at: null,
    rotated_at: null,
    ...overrides,
  });

  const activeUser = {
    status: { success: true, message: 'User details' },
    data: {
      id: 5,
      external_id: 'usr-123',
      email: 'user@example.com',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
    },
  };

  beforeEach(async () => {
    authenticationsRepository = {
      createOtpLog: jest.fn(),
      saveOtpLog: jest.fn(),
      findOtpLog: jest.fn(),
      createUserAuth: jest.fn((payload) => payload),
      saveUserAuth: jest.fn(),
      deactivateToken: jest.fn(),
      findActiveAuthByJti: jest.fn(),
      createUserRefreshToken: jest.fn((payload) => ({ id: 2, ...payload })),
      saveUserRefreshToken: jest.fn((entity) => entity),
      findRefreshTokenByHash: jest.fn(),
      revokeAllActiveRefreshTokens: jest.fn(),
    };
    usersService = { findOne: jest.fn().mockResolvedValue(activeUser) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationsApplicationService,
        { provide: UsersApplicationService, useValue: usersService },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(() => 'new-access-jwt') },
        },
        { provide: EmailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: AUTHENTICATIONS_REPOSITORY,
          useValue: authenticationsRepository,
        },
      ],
    }).compile();

    service = module.get<AuthenticationsApplicationService>(
      AuthenticationsApplicationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('issues a new access token and rotates the refresh token on success', async () => {
    const stored = buildStoredToken();
    authenticationsRepository.findRefreshTokenByHash.mockResolvedValue(stored);

    const dto: RefreshTokenDto = { refresh_token: rawToken };
    const result = await service.refresh(dto);

    expect(result.status.success).toBe(true);
    expect(result.access.token).toBe('new-access-jwt');
    expect(result.access.tokenExpiry).toBeTruthy();
    expect(result.refresh.refresh_token).toBeTruthy();
    expect(result.refresh.refresh_token).not.toBe(rawToken);
    expect(result.refresh.refresh_token_expiry).toBeTruthy();

    expect(
      authenticationsRepository.findRefreshTokenByHash,
    ).toHaveBeenCalledWith(sha256(rawToken));
    // old token rotated/revoked
    expect(stored.revoked_at).toBeInstanceOf(Date);
    expect(stored.rotated_at).toBeInstanceOf(Date);
    expect(authenticationsRepository.saveUserRefreshToken).toHaveBeenCalledWith(
      stored,
    );
    // new hashed refresh token persisted
    expect(
      authenticationsRepository.createUserRefreshToken,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        user_ext_id: 'usr-123',
        token_hash: sha256(result.refresh.refresh_token),
      }),
    );
  });

  it('rejects an unknown refresh token', async () => {
    authenticationsRepository.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(
      service.refresh({ refresh_token: 'does-not-exist' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an expired refresh token', async () => {
    const stored = buildStoredToken({
      expires_at: new Date(Date.now() - 1000),
    });
    authenticationsRepository.findRefreshTokenByHash.mockResolvedValue(stored);

    await expect(service.refresh({ refresh_token: rawToken })).rejects.toThrow(
      new UnauthorizedException({
        status: { success: false, message: 'Refresh token has expired.' },
      }),
    );
    expect(usersService.findOne).not.toHaveBeenCalled();
  });

  it('rejects an explicitly revoked refresh token', async () => {
    const stored = buildStoredToken({ revoked_at: new Date() });
    authenticationsRepository.findRefreshTokenByHash.mockResolvedValue(stored);

    await expect(service.refresh({ refresh_token: rawToken })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(
      authenticationsRepository.revokeAllActiveRefreshTokens,
    ).not.toHaveBeenCalled();
  });

  it('revokes all sessions when a rotated refresh token is reused', async () => {
    const stored = buildStoredToken({
      revoked_at: new Date(),
      rotated_at: new Date(),
    });
    authenticationsRepository.findRefreshTokenByHash.mockResolvedValue(stored);

    await expect(service.refresh({ refresh_token: rawToken })).rejects.toThrow(
      UnauthorizedException,
    );
    expect(
      authenticationsRepository.revokeAllActiveRefreshTokens,
    ).toHaveBeenCalledWith('usr-123');
  });

  it('rejects when the associated user no longer exists', async () => {
    const stored = buildStoredToken();
    authenticationsRepository.findRefreshTokenByHash.mockResolvedValue(stored);
    usersService.findOne.mockRejectedValue(
      new NotFoundException({
        status: { success: false, message: 'User not found' },
      }),
    );

    await expect(service.refresh({ refresh_token: rawToken })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects when the associated user is inactive', async () => {
    const stored = buildStoredToken();
    authenticationsRepository.findRefreshTokenByHash.mockResolvedValue(stored);
    usersService.findOne.mockResolvedValue({
      ...activeUser,
      data: { ...activeUser.data, is_active: false },
    });

    await expect(service.refresh({ refresh_token: rawToken })).rejects.toThrow(
      new UnauthorizedException({
        status: {
          success: false,
          message: 'User account is inactive or unauthorized.',
        },
      }),
    );
  });
});
