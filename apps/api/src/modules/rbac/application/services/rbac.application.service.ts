import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Roles } from '../../domain/entities/roles.entity';
import {
  RBAC_REPOSITORY,
  RbacRepositoryPort,
} from '../../domain/repositories/rbac.repository.port';

@Injectable()
export class RbacApplicationService {
  constructor(
    @Inject(RBAC_REPOSITORY)
    private readonly rbacRepository: RbacRepositoryPort,
  ) {}

  async findAllRole(): Promise<{
    status: { success: boolean; message: string };
    data?: Roles[];
  }> {
    const roles = await this.rbacRepository.findAllRoles();
    return { status: { success: true, message: 'List of users' }, data: roles };
  }

  async findRole(
    name: string,
  ): Promise<{ status: { success: boolean; message: string }; data?: Roles }> {
    const roles = await this.rbacRepository.findRoleByName(name);

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

    const userRoles = await this.rbacRepository.findUserRoleByUserId(userId);

    if (userRoles) {
      const currentRole = await this.rbacRepository.findRoleById(
        userRoles.role_id,
      );

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
      await this.rbacRepository.saveUserRole(userRoles);
    } else {
      const data = { user_id: userId, role_id: role.data.id };
      await this.rbacRepository.saveUserRole(data);
    }

    return {
      status: { success: true, message: 'User role updated successfully.' },
    };
  }
}
