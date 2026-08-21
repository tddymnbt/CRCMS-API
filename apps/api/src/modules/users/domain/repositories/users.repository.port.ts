import { Users } from '../entities/users.entity';
import { FindUsersDto } from '../../application/dtos/find-all-users.dto';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UserWithRoleRow {
  user_id: number;
  user_external_id: string;
  role_id?: string;
  role_name?: string;
  [key: string]: unknown;
}

export interface UsersRepositoryPort {
  findUsers(
    dto: FindUsersDto,
  ): Promise<{ entities: Users[]; raw: UserWithRoleRow[]; total: number }>;
  findUserRawByExtId(extId: string): Promise<UserWithRoleRow | null>;
  findByEmail(email: string): Promise<Users | null>;
  findByEmailExcluding(email: string, extId: string): Promise<Users | null>;
  create(payload: Partial<Users>): Users;
  save(user: Users): Promise<Users>;
  softDelete(id: number): Promise<void>;
  findUserNameByExtId(
    extId: string,
  ): Promise<{ external_id: string; name: string } | null>;
}
