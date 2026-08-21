import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Modules } from 'src/modules/rbac/domain/entities/modules.entity';
import { RolePermissions } from 'src/modules/rbac/domain/entities/role-permissions.entity';
import { Permissions } from 'src/modules/rbac/domain/entities/permissions.entity';
import { Roles } from 'src/modules/rbac/domain/entities/roles.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Roles, Permissions, Modules, RolePermissions]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
