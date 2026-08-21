import { Roles } from '../entities/roles.entity';
import { UserRoles } from '../entities/user-roles.entity';

export const RBAC_REPOSITORY = Symbol('RBAC_REPOSITORY');

export interface RbacRepositoryPort {
  findAllRoles(): Promise<Roles[]>;
  findRoleByName(name: string): Promise<Roles | null>;
  findRoleById(id: number): Promise<Roles | null>;
  findUserRoleByUserId(userId: string): Promise<UserRoles | null>;
  saveUserRole(userRole: Partial<UserRoles>): Promise<UserRoles>;
}
