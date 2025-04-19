import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entity/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUserResponse, IUsersResponse } from './interface/user.interface';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class UsersService {
  constructor(
    private rbacService: RbacService,

    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
  ) {}

  async findAll(): Promise<IUsersResponse> {
    const users = await this.usersRepo.find();
    return { status: { success: true, message: 'List of users' }, data: users };
  }

  async findOne(ext_id: string): Promise<IUserResponse> {
    const user = await this.usersRepo.findOne({
      where: { external_id: ext_id.trim() },
    });
    if (!user)
      throw new NotFoundException({
        status: { success: false, message: 'User not ßfound' },
      });
    return { status: { success: true, message: 'User details' }, data: user };
  }
  async findOneByEmail(email: string): Promise<IUserResponse> {
    const user = await this.usersRepo.findOne({
      where: { email: email.trim() },
    });
    if (!user)
      throw new NotFoundException({
        status: { success: false, message: 'Invalid email address' },
      });
    return { status: { success: true, message: 'User details' }, data: user };
  }

  async create(dto: CreateUserDto): Promise<IUserResponse> {
    const checkDuplicate = await this.usersRepo.findOne({
      where: { email: dto.email.trim() },
    });
    if (checkDuplicate)
      throw new ConflictException({
        status: { success: false, message: 'Email address already exists' },
      });

    const user = this.usersRepo.create(dto);
    user.external_id = generateUniqueId(10);
    await this.usersRepo.save(user);

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
        where: { email: dto.email.trim() },
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
    const user = await this.findOne(ext_id);

    await this.rbacService.updateUserRole(ext_id, dto.roleName);
    user.data.updated_at = new Date();
    user.data.updated_by = dto.updated_by;
    await this.usersRepo.save(user.data);

    return {
      status: { success: true, message: 'User role successfully updated' },
      data: user.data,
    };
  }

  async updateLastDateLogin(email: string): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { email: email.trim() },
    });

    if (!user)
      throw new NotFoundException({
        status: { success: false, message: 'Invalid email address' },
      });

    user.last_login = new Date().toString();
    await this.usersRepo.save(user);
  }
}
