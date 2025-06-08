// clients.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import {
  IClientCount,
  IClientResponse,
  IClientsResponse,
} from './interface/client-response.interface';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindClientsDto } from './dto/find-all-clients.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { DeleteClientDto } from './dto/delete-client.dto';
import { BirthMonthParamDto } from './dto/get-celebrant.dto';
import { ActivityLogsService } from '../activity_logs/activity_logs.service';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly service: ClientsService,
    private loggerService: ActivityLogsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all clients' })
  async findAll(@Query() query: FindClientsDto): Promise<IClientsResponse> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find specific client' })
  async findOne(@Param('id') id: string): Promise<IClientResponse> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create client' })
  async create(@Body() dto: CreateClientDto): Promise<IClientResponse> {
    const response = await this.service.create(dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.created_by,
        'Client',
        'create',
        `Created client ${response.data.first_name} ${response.data.last_name}`,
        response.data.external_id,
      );
    }

    return response;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<IClientResponse> {
    const response = await this.service.update(id, dto);

    if (response.status.success) {
      this.loggerService.log(
        dto.updated_by,
        'Client',
        'update',
        `Updated client ${response.data.first_name} ${response.data.last_name}`,
        id,
      );
    }

    return response;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteClientDto,
  ): Promise<IClientResponse> {
    const response = await this.service.remove(id, dto.deleted_by);

    if (response.status.success) {
      this.loggerService.log(
        dto.deleted_by,
        'Client',
        'delete',
        `Deleted client ${response.data.first_name} ${response.data.last_name}`,
        id,
      );
    }

    return response;
  }

  @Post('celebrant')
  @ApiOperation({ summary: 'Get client celebrants' })
  async findCelebrants(
    @Body() dto: BirthMonthParamDto,
  ): Promise<IClientsResponse> {
    return this.service.getClientsByBirthMonth(dto);
  }

  @Get('stats/counts')
  @ApiOperation({ summary: 'Find client count' })
  async getCounts(): Promise<IClientCount> {
    return this.service.getClientCounts();
  }
}
