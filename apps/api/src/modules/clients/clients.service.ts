// clients.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { IClientResponse } from './interface/client-response.interface';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async create(dto: CreateClientDto): Promise<IClientResponse> {
    const newClient = this.clientRepo.create(dto);
    const saved = await this.clientRepo.save(newClient);
    return this.mapToResponse(saved[0]);
  }

  async findAll(
    page = 1,
    limit = 10,
    isActive?: boolean,
    isConsignor?: boolean,
  ): Promise<{ data: IClientResponse[]; total: number }> {
    const skip = (page - 1) * limit;

    const where = {
      deleted_at: null,
      ...(isActive !== undefined && { is_active: isActive }),
      ...(isConsignor !== undefined && { is_consignor: isConsignor }),
    };

    const [clients, total] = await this.clientRepo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      take: limit,
      skip,
    });

    return {
      data: clients.map(this.mapToResponse),
      total,
    };
  }

  async findOne(id: number): Promise<IClientResponse> {
    const client = await this.clientRepo.findOne({
      where: { id, deleted_at: null },
    });
    if (!client) throw new NotFoundException('Client not found');
    return this.mapToResponse(client);
  }

  async update(id: number, dto: UpdateClientDto): Promise<IClientResponse> {
    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    Object.assign(client, dto);
    await this.clientRepo.save(client);
    return this.mapToResponse(client);
  }

  async softDelete(id: number, deletedBy: string): Promise<void> {
    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    client.deleted_at = new Date();
    client.deleted_by = deletedBy;
    await this.clientRepo.save(client);
  }

  async setAsConsignor(
    id: number,
    updatedBy: string,
  ): Promise<IClientResponse> {
    const client = await this.clientRepo.findOne({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');

    client.is_consignor = true;
    client.updated_by = updatedBy;
    client.updated_at = new Date();
    await this.clientRepo.save(client);
    return this.mapToResponse(client);
  }

  private mapToResponse(c: Client): IClientResponse {
    return {
      id: c.id,
      external_id: c.external_id,
      full_name: [c.first_name, c.middle_name, c.last_name, c.suffix]
        .filter(Boolean)
        .join(' '),
      email: c.email,
      is_consignor: c.is_consignor,
      is_active: c.is_active,
      created_at: c.created_at,
    };
  }
}
