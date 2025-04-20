// clients.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Body,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { IClientResponse } from './interface/client-response.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post()
  create(@Body() dto: CreateClientDto): Promise<IClientResponse> {
    return this.service.create(dto);
  }

  @Get()
  getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('is_active', new DefaultValuePipe(true), ParseBoolPipe)
    isActive?: boolean,
    @Query('is_consignor', new DefaultValuePipe(false), ParseBoolPipe)
    isConsignor?: boolean,
  ): Promise<{ data: IClientResponse[]; total: number }> {
    return this.service.findAll(
      page,
      limit,
      isActive !== undefined ? isActive : undefined,
      isConsignor !== undefined ? isConsignor : undefined,
    );
  }

  @Get(':id')
  getById(@Param('id') id: number): Promise<IClientResponse> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() dto: UpdateClientDto,
  ): Promise<IClientResponse> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  softDelete(
    @Param('id') id: number,
    @Query('deleted_by') deletedBy: string,
  ): Promise<void> {
    return this.service.softDelete(id, deletedBy);
  }

  @Patch(':id/set-consignor')
  setAsConsignor(
    @Param('id') id: number,
    @Query('updated_by') updatedBy: string,
  ): Promise<IClientResponse> {
    return this.service.setAsConsignor(id, updatedBy);
  }
}
