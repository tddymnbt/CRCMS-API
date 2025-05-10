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
  IClientResponse,
  IClientsResponse,
} from './interface/client-response.interface';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindClientsDto } from './dto/find-all-clients.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { DeleteClientDto } from './dto/delete-client.dto';
import { BirthMonthParamDto } from './dto/get-celebrant.dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'Find all clients' })
  async findAll(@Query() query: FindClientsDto): Promise<IClientsResponse> {
    console.log(query);
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
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update client' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<IClientResponse> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client' })
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteClientDto,
  ): Promise<IClientResponse> {
    return this.service.remove(id, dto.deleted_by);
  }

  @Post('celebrant')
  @ApiOperation({ summary: 'Get client celebrants' })
  async findCelebrants(
    @Body() dto: BirthMonthParamDto,
  ): Promise<IClientsResponse> {
    return this.service.getClientsByBirthMonth(dto);
  }
}
