import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './domain/entities/roles.entity';
import { UserRoles } from './domain/entities/user-roles.entity';
import { RbacApplicationService } from './application/services/rbac.application.service';
import { RBAC_REPOSITORY } from './domain/repositories/rbac.repository.port';
import { TypeormRbacRepository } from './infrastructure/repositories/typeorm-rbac.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Roles, UserRoles])],
  controllers: [RbacController],
  providers: [
    RbacApplicationService,
    {
      provide: RBAC_REPOSITORY,
      useClass: TypeormRbacRepository,
    },
  ],
  exports: [RbacApplicationService],
})
export class RbacModule {}
