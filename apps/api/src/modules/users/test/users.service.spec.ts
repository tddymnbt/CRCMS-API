import { Test, TestingModule } from '@nestjs/testing';
import { UsersApplicationService } from '../application/services/users.application.service';
import { RbacApplicationService } from '../../rbac/application/services/rbac.application.service';
import { USERS_REPOSITORY } from '../domain/repositories/users.repository.port';

describe('UsersApplicationService', () => {
  let service: UsersApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersApplicationService,
        { provide: RbacApplicationService, useValue: {} },
        {
          provide: USERS_REPOSITORY,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<UsersApplicationService>(UsersApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
