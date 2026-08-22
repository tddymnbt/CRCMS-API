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
import { ClientsApplicationService } from './application/services/clients.application.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FindClientsDto } from './application/dtos/find-all-clients.dto';
import { CreateClientDto } from './application/dtos/create-client.dto';
import { UpdateClientDto } from './application/dtos/update-client.dto';
import { DeleteClientDto } from './application/dtos/delete-client.dto';
import { BirthMonthParamDto } from './application/dtos/get-celebrant.dto';
import {
  ClientListResponseDto,
  ClientResponseDto,
} from './application/dtos/client.response.dto';
import { CountStatsResponseDto } from 'src/common/swagger/count-stats.response.dto';
import {
  ApiBusinessError,
  ApiValidationError,
} from 'src/common/swagger/api-error-responses.decorator';
import { ActivityLogsApplicationService } from '../activity_logs/application/services/activity-logs.application.service';

@ApiTags('clients')
@ApiBearerAuth('access-token')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly service: ClientsApplicationService,
    private loggerService: ActivityLogsApplicationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Find all clients' })
  @ApiOkResponse({
    description: 'Paginated list of clients',
    type: ClientListResponseDto,
  })
  @ApiValidationError()
  async findAll(
    @Query() query: FindClientsDto,
  ): Promise<ClientListResponseDto> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find specific client' })
  @ApiParam({ name: 'id', description: 'External id of the client' })
  @ApiOkResponse({ description: 'Client details', type: ClientResponseDto })
  @ApiBusinessError(404, 'No client exists with the given external id')
  async findOne(@Param('id') id: string): Promise<ClientResponseDto> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create client' })
  @ApiCreatedResponse({
    description: 'Client successfully created',
    type: ClientResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    'Bank details are required when the client is tagged as a consignor',
  )
  @ApiBusinessError(
    409,
    'Email address already exists or duplicate client details',
  )
  async create(@Body() dto: CreateClientDto): Promise<ClientResponseDto> {
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
  @ApiParam({ name: 'id', description: 'External id of the client' })
  @ApiOkResponse({
    description: 'Client successfully updated',
    type: ClientResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(400, '`updated_by` is required')
  @ApiBusinessError(404, 'No client exists with the given external id')
  @ApiBusinessError(
    409,
    'Email address already exists or duplicate client details',
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
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
  @ApiParam({ name: 'id', description: 'External id of the client' })
  @ApiOkResponse({
    description: 'Client successfully soft-deleted',
    type: ClientResponseDto,
  })
  @ApiValidationError()
  @ApiBusinessError(
    400,
    '`deleted_by` is required or the client has existing transactions',
  )
  @ApiBusinessError(404, 'No client exists with the given external id')
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteClientDto,
  ): Promise<ClientResponseDto> {
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
  @ApiOkResponse({
    description:
      'Active clients whose birth month matches the given month. Returns HTTP 200 with an empty list when none match.',
    type: ClientListResponseDto,
  })
  @ApiValidationError()
  async findCelebrants(
    @Body() dto: BirthMonthParamDto,
  ): Promise<ClientListResponseDto> {
    return this.service.getClientsByBirthMonth(dto);
  }

  @Get('stats/counts')
  @ApiOperation({ summary: 'Find client count' })
  @ApiOkResponse({
    description: 'Client counts grouped by creation period',
    type: CountStatsResponseDto,
  })
  async getCounts(): Promise<CountStatsResponseDto> {
    return this.service.getClientCounts();
  }
}
