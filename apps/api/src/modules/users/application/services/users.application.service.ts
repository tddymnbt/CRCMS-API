import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IUserActionResponse,
  IUserResponse,
  IUsersResponse,
} from '../../application/interfaces/user.interface';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { UpdateUserRoleDto } from '../../application/dtos/update-user-role.dto';
import { RbacApplicationService } from '../../../rbac/application/services/rbac.application.service';
import { FindUsersDto } from '../../application/dtos/find-all-users.dto';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import {
  USERS_REPOSITORY,
  UsersRepositoryPort,
} from '../../domain/repositories/users.repository.port';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class UsersApplicationService {
  constructor(
    private rbacService: RbacApplicationService,

    @Inject(USERS_REPOSITORY)
    private usersRepository: UsersRepositoryPort,
  ) {}

  async findAll(dto: FindUsersDto): Promise<IUsersResponse> {
    const { pageNumber = 1, displayPerPage = 10 } = dto;

    const {
      entities,
      raw,
      total: totalCount,
    } = await this.usersRepository.findUsers(dto);

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
        totalNumber: totalCount,
        totalPages: Math.ceil(totalCount / displayPerPage),
        displayPage: displayPerPage,
      },
    };
  }

  async findOne(ext_id: string): Promise<IUserResponse> {
    const user = await this.usersRepository.findUserRawByExtId(ext_id);

    if (!user)
      throw new NotFoundException({
        status: { success: false, message: 'User not found' },
      });

    const performedBy = await this.getPerformedBy(
      user.user_created_by as string,
      user.user_updated_by as string,
      user.user_deleted_by as string,
    );

    return {
      status: { success: true, message: 'User details' },
      data: {
        id: user.user_id,
        external_id: user.user_external_id,
        first_name: user.user_first_name as string,
        last_name: user.user_last_name as string,
        email: user.user_email as string,
        is_active: user.user_is_active as boolean,
        created_at: user.user_created_at as Date,
        created_by:
          performedBy.data.create?.name ||
          (user.user_created_by as string) ||
          null,
        updated_at: user.user_updated_at as Date,
        updated_by:
          performedBy.data.update?.name ||
          (user.user_updated_by as string) ||
          null,
        deleted_at: user.user_deleted_at as Date,
        deleted_by:
          performedBy.data.delete?.name ||
          (user.user_deleted_by as string) ||
          null,
        last_login: user.user_last_login as string,
        role: user.role_id
          ? { id: user.role_id, name: user.role_name }
          : undefined,
      },
    };
  }

  async findOneByEmail(email: string): Promise<IUserResponse> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      return {
        status: { success: false, message: 'Email is not registered.' },
      };
    }

    return {
      status: { success: true, message: 'User details' },
      data: {
        id: user.id,
        external_id: user.external_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        is_active: user.is_active,
        created_at: user.created_at,
        created_by: user.created_by,
        updated_at: user.updated_at,
        updated_by: user.updated_by,
        deleted_at: user.deleted_at,
        deleted_by: user.deleted_by,
        last_login: user.last_login,
        role: user.roles
          ? {
              id: String(user.roles[0].role_id),
              name: user.roles[0].roles.name,
            }
          : undefined,
      },
    };
  }

  async create(dto: CreateUserDto): Promise<IUserResponse> {
    const checkDuplicate = await this.usersRepository.findByEmail(dto.email);
    if (checkDuplicate)
      throw new ConflictException({
        status: { success: false, message: 'Email address already exists' },
      });

    const extId = generateUniqueId(10);

    const user = this.usersRepository.create(dto);
    user.external_id = extId;
    await this.usersRepository.save(user);

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
      const checkDuplicate = await this.usersRepository.findByEmailExcluding(
        dto.email,
        ext_id,
      );
      if (checkDuplicate)
        throw new ConflictException({
          status: { success: false, message: 'Email address already exists' },
        });
    }

    Object.assign(user.data, dto);
    user.data.updated_at = new Date();
    user.data.updated_by = dto.updated_by;
    await this.usersRepository.save(user.data as never);

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
    await this.usersRepository.save(user.data as never);

    await this.usersRepository.softDelete(user.data.id);

    return {
      status: { success: true, message: 'User successfully deleted.' },
      data: user.data,
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
    await this.usersRepository.save(user.data as never);
    user = await this.findOne(ext_id);

    return {
      status: { success: true, message: 'User role successfully updated' },
      data: user.data,
    };
  }

  async updateLastDateLogin(email: string): Promise<string> {
    const user = await this.usersRepository.findByEmail(email);

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
    await this.usersRepository.save(user);

    return gmt8.toString();
  }

  async getPerformedBy(
    create_ext_id?: string,
    update_ext_id?: string,
    delete_ext_id?: string,
  ): Promise<IUserActionResponse> {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const getUser = (externalId?: string) => {
      return this.usersRepository.findUserNameByExtId(externalId);
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
