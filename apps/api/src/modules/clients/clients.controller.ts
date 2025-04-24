// clients.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { IClientResponse, IClientsResponse } from './interface/client-response.interface';
import { ApiTags } from '@nestjs/swagger';
import { FindClientsDto } from './dto/find-all-clients.dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  // @Post()
  // create(@Body() dto: CreateClientDto): Promise<IClientResponse> {
  //   return this.service.create(dto);
  // }

  @Get()
    async findAll(@Query() query: FindClientsDto): Promise<IClientsResponse> {
      return this.service.findAll(query);
    }


  @Get(':id')
  async findOne(@Param('id') id: string): Promise<IClientResponse> {
    return this.service.findOne(id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: number,
  //   @Body() dto: UpdateClientDto,
  // ): Promise<IClientResponse> {
  //   return this.service.update(id, dto);
  // }

  // @Delete(':id')
  // softDelete(
  //   @Param('id') id: number,
  //   @Query('deleted_by') deletedBy: string,
  // ): Promise<void> {
  //   return this.service.softDelete(id, deletedBy);
  // }

  // @Patch(':id/set-consignor')
  // setAsConsignor(
  //   @Param('id') id: number,
  //   @Query('updated_by') updatedBy: string,
  // ): Promise<IClientResponse> {
  //   return this.service.setAsConsignor(id, updatedBy);
  // }
}
