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
import { UsersApplicationService } from './application/services/users.application.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserDto } from './application/dtos/create-user.dto';
import { UpdateUserDto } from './application/dtos/update-user.dto';
import { DeleteUserDto } from './application/dtos/delete-user.dto';
import { UpdateUserRoleDto } from './application/dtos/update-user-role.dto';
// import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { FindUsersDto } from './application/dtos/find-all-users.dto';
import {
  UserListResponseDto,
  UserResponseDto,
} from './application/dtos/user.response.dto';
import {
  ApiBusinessError,
  ApiValidationError,
} from 'src/common/swagger/api-error-responses.decorator';
import { ActivityLogsApplicationService } from '../activity_logs/application/services/activity-logs.application.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
// @UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly UsersApplicationService: UsersApplicationService,
    private loggerService: ActivityLogsApplicationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all users' })
  @ApiOkResponse({
    description: 'Paginated list of users',
    type: UserListResponseDto,
  })
  @ApiValidationError()
  async findAll(@Query() query: FindUsersDto): Promise<UserListResponseDto> {
    return this.UsersApplicationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find specific user' })
  @ApiParam({ name: 'id', description: 'External id of the user' })
  @ApiOkResponse({ description: 'User details', type: UserResponseDto })
  @ApiBusinessError(404, 'No user exists with the given external id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.UsersApplicationService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({
    description: 'User successfully created (a default Staff role is assigned)',
    type: UserResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(409, 'A user with the same email address already exists')
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    const response = await this.UsersApplicationService.create(dto);

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
  @ApiParam({ name: 'id', description: 'External id of the user' })
  @ApiOkResponse({
    description: 'User successfully updated',
    type: UserResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(400, '`updated_by` is required')
  @ApiBusinessError(404, 'No user exists with the given external id')
  @ApiBusinessError(409, 'Another user already uses the given email address')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const response = await this.UsersApplicationService.update(id, dto);

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
  @ApiParam({ name: 'id', description: 'External id of the user' })
  @ApiOkResponse({
    description: 'User successfully soft-deleted',
    type: UserResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(400, '`deleted_by` is required')
  @ApiBusinessError(404, 'No user exists with the given external id')
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteUserDto,
  ): Promise<UserResponseDto> {
    const response = await this.UsersApplicationService.remove(
      id,
      dto.deleted_by,
    );

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
  @ApiParam({ name: 'id', description: 'External id of the user' })
  @ApiOkResponse({
    description: 'User role successfully updated',
    type: UserResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(404, 'User or role not found')
  @ApiBusinessError(409, 'User was already assigned to this role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<UserResponseDto> {
    const response = await this.UsersApplicationService.updateUserRole(id, dto);

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
