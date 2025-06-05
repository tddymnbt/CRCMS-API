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

@ApiTags('users')
@ApiBearerAuth('access-token')
// @UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    return this.usersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<IUserResponse> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteUserDto,
  ): Promise<IUserResponse> {
    return this.usersService.remove(id, dto.deleted_by);
  }

  @Put('update-role/:id')
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<IUserResponse> {
    return this.usersService.updateUserRole(id, dto);
  }
}
