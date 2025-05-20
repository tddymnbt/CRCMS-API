import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Users } from './entity/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  IUserActionResponse,
  IUserResponse,
  IUsersResponse,
} from './interface/user.interface';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RbacService } from '../rbac/rbac.service';
import { FindUsersDto } from './dto/find-all-users.dto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class UsersService {
  constructor(
    private rbacService: RbacService,

    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
  ) {}

  async findAll(dto: FindUsersDto): Promise<IUsersResponse> {
    const {
      searchValue,
      isActive = 'Y',
      pageNumber = 1,
      displayPerPage = 10,
      sortBy = 'first_name',
      orderBy = 'asc',
    } = dto;

    const query = this.usersRepo
      .createQueryBuilder('user')
      .leftJoin('user_roles', 'ur', 'ur.user_id = user.external_id')
      .leftJoin('roles', 'r', 'r.id = ur.role_id')
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
      ]);

    if (searchValue) {
      query.andWhere(
        '(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${searchValue}%` },
      );
    }

    const active = isActive?.toUpperCase() === 'Y';
    query.andWhere('user.is_active = :isActive', { isActive: active });
    query.orderBy(`user.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC');
    query.skip((pageNumber - 1) * displayPerPage).take(displayPerPage);

    const { entities, raw } = await query.getRawAndEntities();

    const users = await Promise.all(
      entities.map(async (user, index) => {
        const performedBy = await this.getPerformedBy(
          user.created_by,
          user.updated_by,
          user.deleted_by,
        );

        return {
          ...user,
          created_by: performedBy.data.create?.name || user.created_by || null,
          updated_by: performedBy.data.update?.name || user.updated_by || null,
          deleted_by: performedBy.data.delete?.name || user.deleted_by || null,
          role: raw[index].role_id
            ? { id: raw[index].role_id, name: raw[index].role_name }
            : undefined,
        };
      }),
    );

    return {
      status: { success: true, message: 'List of users' },
      data: users,
      meta: {
        page: pageNumber,
        totalNumber: users.length,
        totalPages: Math.ceil(users.length / displayPerPage),
        displayPage: displayPerPage,
      },
    };
  }

  async findOne(ext_id: string): Promise<IUserResponse> {
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoin('user_roles', 'ur', 'ur.user_id = user.external_id')
      .leftJoin('roles', 'r', 'r.id = ur.role_id')
      .where('user.external_id = :external_id', { external_id: ext_id.trim() })
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
  
    if (!user)
      throw new NotFoundException({
        status: { success: false, message: 'User not found' },
      });
  
    const performedBy = await this.getPerformedBy(
      user.user_created_by,
      user.user_updated_by,
      user.user_deleted_by,
    );
  
    return {
      status: { success: true, message: 'User details' },
      data: {
        id: user.user_id,
        external_id: user.user_external_id,
        first_name: user.user_first_name,
        last_name: user.user_last_name,
        email: user.user_email,
        is_active: user.user_is_active,
        created_at: user.user_created_at,
        created_by:
          performedBy.data.create?.name || user.user_created_by || null,
        updated_at: user.user_updated_at,
        updated_by:
          performedBy.data.update?.name || user.user_updated_by || null,
        deleted_at: user.user_deleted_at,
        deleted_by:
          performedBy.data.delete?.name || user.user_deleted_by || null,
        last_login: user.user_last_login,
        role: user.role_id ? { id: user.role_id, name: user.role_name } : undefined,
      },
    };
  }

  async findOneByEmail(email: string): Promise<IUserResponse> {
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user_roles', 'ur', 'ur.user_id = user.external_id')
      .leftJoinAndSelect('roles', 'r', 'r.id = ur.role_id')
      .where('user.email = :email', { email: email.trim() })
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
        'r.id',
        'r.name',
      ])
      .getRawOne();

    if (!user) {
      throw new NotFoundException({
        status: { success: false, message: 'Invalid email address' },
      });
    }

    return {
      status: { success: true, message: 'User details' },
      data: {
        id: user.user_id,
        external_id: user.user_external_id,
        first_name: user.user_first_name,
        last_name: user.user_last_name,
        email: user.user_email,
        is_active: user.user_is_active,
        created_at: user.user_created_at,
        created_by: user.user_created_by,
        updated_at: user.user_updated_at,
        updated_by: user.user_updated_by,
        deleted_at: user.user_deleted_at,
        deleted_by: user.user_deleted_by,
        last_login: user.user_last_login,
        role: user.r_id ? { id: user.r_id, name: user.r_name } : undefined,
      },
    };
  }

  async create(dto: CreateUserDto): Promise<IUserResponse> {
    const checkDuplicate = await this.usersRepo.findOne({
      where: { email: dto.email.trim() },
    });
    if (checkDuplicate)
      throw new ConflictException({
        status: { success: false, message: 'Email address already exists' },
      });

    const extId = generateUniqueId(10);

    const user = this.usersRepo.create(dto);
    user.external_id = extId;
    await this.usersRepo.save(user);

    //Assign default role, staff
    const assignRoleDto: UpdateUserRoleDto = {
      roleName: 'Staff',
      updated_by: extId,
    };
    await this.updateUserRole(extId, assignRoleDto);

    return {
      status: { success: true, message: 'User successfully created' },
      data: user,
    };
  }

  async update(ext_id: string, dto: UpdateUserDto): Promise<IUserResponse> {
    if (!dto.updated_by)
      throw new BadRequestException({
        status: { success: false, message: 'Updated By is required' },
      });

    const user = await this.findOne(ext_id);

    if (dto.email) {
      const checkDuplicate = await this.usersRepo.findOne({
        where: { email: dto.email.trim(), external_id: Not(ext_id.trim()) },
      });
      if (checkDuplicate)
        throw new ConflictException({
          status: { success: false, message: 'Email address already exists' },
        });
    }

    Object.assign(user.data, dto);
    user.data.updated_at = new Date();
    user.data.updated_by = dto.updated_by;
    await this.usersRepo.save(user.data);

    return {
      status: { success: true, message: 'User successfully updated' },
      data: user.data,
    };
  }

  async remove(ext_id: string, deleted_by: string): Promise<IUserResponse> {
    if (!deleted_by)
      throw new BadRequestException({
        status: { success: false, message: 'Deleted By is required' },
      });

    const user = await this.findOne(ext_id);
    user.data.is_active = false;
    user.data.deleted_by = deleted_by;
    await this.usersRepo.save(user.data);

    await this.usersRepo.softDelete(user.data.id);

    return {
      status: { success: true, message: 'User successfully deleted.' },
    };
  }

  async updateUserRole(
    ext_id: string,
    dto: UpdateUserRoleDto,
  ): Promise<IUserResponse> {
    let user = await this.findOne(ext_id);

    await this.rbacService.updateUserRole(ext_id, dto.roleName);
    user.data.updated_at = new Date();
    user.data.updated_by = dto.updated_by;
    await this.usersRepo.save(user.data);
    user = await this.findOne(ext_id);

    return {
      status: { success: true, message: 'User role successfully updated' },
      data: user.data,
    };
  }

  async updateLastDateLogin(email: string): Promise<string> {
    const user = await this.usersRepo.findOne({
      where: { email: email.trim() },
    });

    if (!user)
      throw new NotFoundException({
        status: { success: false, message: 'Invalid email address' },
      });
    const now = new Date();
    const gmt8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    };

    user.last_login = gmt8.toLocaleString('en-US', options);
    await this.usersRepo.save(user);

    return gmt8.toString();
  }

  async getPerformedBy(
    create_ext_id?: string,
    update_ext_id?: string,
    delete_ext_id?: string,
  ): Promise<IUserActionResponse> {
    const getUser = (externalId?: string) => {
      if (!externalId?.trim()) return Promise.resolve(null);
      return this.usersRepo
        .createQueryBuilder('user')
        .select([
          'user.external_id',
          `CONCAT(user.first_name, ' ', user.last_name) AS name`,
        ])
        .where('user.external_id = :externalId', {
          externalId: externalId.trim(),
        })
        .andWhere('user.deleted_at IS NULL')
        .getRawOne();
    };

    const [createdBy, updatedBy, deletedBy] = await Promise.all([
      getUser(create_ext_id),
      getUser(update_ext_id),
      getUser(delete_ext_id),
    ]);

    return {
      status: {
        success: true,
        message: 'User actions retrieved successfully',
      },
      data: {
        ...(createdBy && { create: createdBy }),
        ...(updatedBy && { update: updatedBy }),
        ...(deletedBy && { delete: deletedBy }),
      },
    };
  }
}
