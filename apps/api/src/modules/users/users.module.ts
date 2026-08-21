import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './domain/entities/users.entity';
import { RbacModule } from '../rbac/rbac.module';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';
import { UsersApplicationService } from './application/services/users.application.service';
import { USERS_REPOSITORY } from './domain/repositories/users.repository.port';
import { TypeormUsersRepository } from './infrastructure/repositories/typeorm-users.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    RbacModule,
    forwardRef(() => ActivityLogsModule),
  ],
  providers: [
    UsersApplicationService,
    {
      provide: USERS_REPOSITORY,
      useClass: TypeormUsersRepository,
    },
  ],
  controllers: [UsersController],
  exports: [UsersApplicationService],
})
export class UsersModule {}
