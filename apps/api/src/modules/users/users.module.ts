import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';
import { RbacModule } from '../rbac/rbac.module';
import { ActivityLogsModule } from '../activity_logs/activity_logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    RbacModule,
    forwardRef(() => ActivityLogsModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
