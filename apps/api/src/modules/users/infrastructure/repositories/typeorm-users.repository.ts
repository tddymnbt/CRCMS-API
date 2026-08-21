import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Users } from '../../domain/entities/users.entity';
import {
  UserWithRoleRow,
  UsersRepositoryPort,
} from '../../domain/repositories/users.repository.port';
import { FindUsersDto } from '../../application/dtos/find-all-users.dto';

@Injectable()
export class TypeormUsersRepository implements UsersRepositoryPort {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepo: Repository<Users>,
  ) {}

  async findUsers(dto: FindUsersDto): Promise<{
    entities: Users[];
    raw: UserWithRoleRow[];
    total: number;
  }> {
    const {
      searchValue,
      isActive = 'Y',
      pageNumber = 1,
      displayPerPage = 10,
      sortBy = 'first_name',
      orderBy = 'asc',
    } = dto;

    const baseQuery = this.usersRepo
      .createQueryBuilder('user')
      .leftJoin('user_roles', 'ur', 'ur.user_id = user.external_id')
      .leftJoin('roles', 'r', 'r.id = ur.role_id')
      .where('user.email <> :excludeEmail', {
        excludeEmail: 'lwphtestemail@yopmail.com',
      });

    if (searchValue) {
      baseQuery.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${searchValue}%` },
      );
    }

    const active = isActive?.toUpperCase() === 'Y';
    baseQuery.andWhere('user.is_active = :isActive', { isActive: active });

    const totalCount = await baseQuery.clone().getCount();

    const query = baseQuery
      .select([
        'user.id',
        'user.external_id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.is_active',
        'user.created_at',
        'user.created_by',
        'user.updated_at',
        'user.updated_by',
        'user.deleted_at',
        'user.deleted_by',
        'user.last_login',
        'r.id as role_id',
        'r.name as role_name',
      ])
      .orderBy(`user.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC')
      .skip((pageNumber - 1) * displayPerPage)
      .take(displayPerPage);

    const { entities, raw } = await query.getRawAndEntities();

    return { entities, raw, total: totalCount };
  }

  async findUserRawByExtId(extId: string): Promise<UserWithRoleRow | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .leftJoin('user_roles', 'ur', 'ur.user_id = user.external_id')
      .leftJoin('roles', 'r', 'r.id = ur.role_id')
      .where('user.external_id = :external_id', {
        external_id: extId.trim(),
      })
      .select([
        'user.id',
        'user.external_id',
        'user.first_name',
        'user.last_name',
        'user.email',
        'user.is_active',
        'user.created_at',
        'user.created_by',
        'user.updated_at',
        'user.updated_by',
        'user.deleted_at',
        'user.deleted_by',
        'user.last_login',
        'r.id as role_id',
        'r.name as role_name',
      ])
      .getRawOne();
  }

  findByEmail(email: string): Promise<Users | null> {
    return this.usersRepo.findOne({
      where: { email: email.trim() },
      relations: ['roles', 'roles.roles'],
    });
  }

  findByEmailExcluding(email: string, extId: string): Promise<Users | null> {
    return this.usersRepo.findOne({
      where: { email: email.trim(), external_id: Not(extId.trim()) },
    });
  }

  create(payload: Partial<Users>): Users {
    return this.usersRepo.create(payload);
  }

  save(user: Users): Promise<Users> {
    return this.usersRepo.save(user);
  }

  async softDelete(id: number): Promise<void> {
    await this.usersRepo.softDelete(id);
  }

  findUserNameByExtId(
    extId: string,
  ): Promise<{ external_id: string; name: string } | null> {
    if (!extId?.trim()) return Promise.resolve(null);
    return this.usersRepo
      .createQueryBuilder('user')
      .select([
        'user.external_id',
        `CONCAT(user.first_name, ' ', user.last_name) AS name`,
      ])
      .where('user.external_id = :externalId', {
        externalId: extId.trim(),
      })
      .andWhere('user.deleted_at IS NULL')
      .getRawOne();
  }
}
