import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  // UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { IUserResponse, IUsersResponse } from './interface/user.interface';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
// import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { FindUsersDto } from './dto/find-all-users.dto';
import { ActivityLogsService } from '../activity_logs/activity_logs.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
// @UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private loggerService: ActivityLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all users' })
  async findAll(@Query() query: FindUsersDto): Promise<IUsersResponse> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find specific user' })
  async findOne(@Param('id') id: string): Promise<IUserResponse> {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  async create(@Body() dto: CreateUserDto): Promise<IUserResponse> {
    const response = await this.usersService.create(dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.created_by,
        'Users',
        'create',
        `Created user ${response.data.first_name} ${response.data.last_name}`,
        response.data.external_id,
      );
    }

    return response;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<IUserResponse> {
    const response = await this.usersService.update(id, dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.updated_by,
        'Users',
        'update',
        `Updated user ${response.data.first_name} ${response.data.last_name}`,
        id,
      );
    }

    return response;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteUserDto,
  ): Promise<IUserResponse> {
    const response = await this.usersService.remove(id, dto.deleted_by);

    if (response.status.success) {
      this.loggerService.log(
        dto.deleted_by,
        'Users',
        'delete',
        `Deleted user ${response.data.first_name} ${response.data.last_name}`,
        id,
      );
    }

    return response;
  }

  @Put('update-role/:id')
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<IUserResponse> {
    const response = await this.usersService.updateUserRole(id, dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.updated_by,
        'Users',
        'update',
        `Updated user role ${response.data.first_name} ${response.data.last_name}`,
        id,
      );
    }

    return response;
  }
}
