import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entity/users.entity';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [TypeOrmModule.forFeature([Users]), RbacModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
