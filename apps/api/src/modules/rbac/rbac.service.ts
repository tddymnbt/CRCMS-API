import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Roles } from './entities/roles.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UserRoles } from './entities/user-roles.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Roles)
    private roleRepo: Repository<Roles>,

    @InjectRepository(UserRoles)
    private userRoleRepo: Repository<UserRoles>,
  ) {}

  async findAllRole(): Promise<{
    status: { success: boolean; message: string };
    data?: Roles[];
  }> {
    const roles = await this.roleRepo.find();
    return { status: { success: true, message: 'List of users' }, data: roles };
  }

  async findRole(
    name: string,
  ): Promise<{ status: { success: boolean; message: string }; data?: Roles }> {
    const roles = await this.roleRepo.findOne({
      where: { name: ILike(name.trim()) },
    });

    if (!roles)
      throw new NotFoundException({
        status: { success: false, message: 'Role not found.' },
      });

    return { status: { success: true, message: 'List of users' }, data: roles };
  }
  async updateUserRole(
    userId: string,
    roleName: string,
  ): Promise<{ status: { success: boolean; message: string } }> {
    const role = await this.findRole(roleName);

    if (!role.status.success || !role.data) {
      return {
        status: { success: false, message: role.status.message },
      };
    }

    const userRoles = await this.userRoleRepo.findOne({
      where: { user_id: userId.trim() },
    });

    if (userRoles) {
      const currentRole = await this.roleRepo.findOne({
        where: { id: userRoles.role_id },
      });

      if (
        currentRole &&
        currentRole.name.toLowerCase() === roleName.trim().toLowerCase()
      ) {
        throw new ConflictException({
          status: {
            success: false,
            message: 'User was already assigned to this role.',
          },
        });
      }

      userRoles.role_id = role.data.id;
      userRoles.created_at = new Date();
      await this.userRoleRepo.save(userRoles);
    } else {
      const data = { user_id: userId, role_id: role.data.id };
      await this.userRoleRepo.save(data);
    }

    return {
      status: { success: true, message: 'User role updated successfully.' },
    };
  }
}
