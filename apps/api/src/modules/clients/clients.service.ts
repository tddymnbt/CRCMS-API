// clients.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { IClientResponse, IClientsResponse } from './interface/client-response.interface';
import { FindClientsDto } from './dto/find-all-clients.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
  ) {}

  async findAll(dto: FindClientsDto): Promise<IClientsResponse> {
    const {
      searchValue,
      isActive = true,
      isConsignor = false,
      pageNumber = 1,
      displayPerPage = 10,
      sortBy = 'first_name',
      orderBy = 'asc',
    } = dto;

    const query = this.clientRepo.createQueryBuilder('client');

    if (searchValue) {
      query.andWhere(
        '(client.first_name ILIKE :search OR client.last_name ILIKE :search OR client.email ILIKE :search OR client.instagram ILIKE :search OR client.facebook ILIKE :search)',
        { search: `%${searchValue}%` },
      );
    }

    query.andWhere('client.is_active = :isActive', { isActive });
    query.andWhere('client.is_consignor = :isConsignor', { isConsignor });
    query.orderBy(`client.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC');
    query.skip((pageNumber - 1) * displayPerPage).take(displayPerPage);

    const [clients, total] = await query.getManyAndCount();

    return {
      status: { success: true, message: 'List of clients' },
      data: clients,
      meta: {
        page: pageNumber,
        totalNumber: total,
        totalPages: Math.ceil(total / displayPerPage),
        displayPage: displayPerPage,
      },
    };
  }

  async findOne(ext_id: string): Promise<IClientResponse> {
    const client = await this.clientRepo.findOne({
      where: { external_id: ext_id.trim() },
    });
    if (!client)
      throw new NotFoundException({
        status: { success: false, message: 'Client not found' },
      });
    return { status: { success: true, message: 'Client details' }, data: client };
  }

  // async update(id: number, dto: UpdateClientDto): Promise<IClientResponse> {
  //   const client = await this.clientRepo.findOne({ where: { id } });
  //   if (!client) throw new NotFoundException('Client not found');

  //   Object.assign(client, dto);
  //   await this.clientRepo.save(client);
  //   return this.mapToResponse(client);
  // }

  // async softDelete(id: number, deletedBy: string): Promise<void> {
  //   const client = await this.clientRepo.findOne({ where: { id } });
  //   if (!client) throw new NotFoundException('Client not found');

  //   client.deleted_at = new Date();
  //   client.deleted_by = deletedBy;
  //   await this.clientRepo.save(client);
  // }

  // async setAsConsignor(
  //   id: number,
  //   updatedBy: string,
  // ): Promise<IClientResponse> {
  //   const client = await this.clientRepo.findOne({ where: { id } });
  //   if (!client) throw new NotFoundException('Client not found');

  //   client.is_consignor = true;
  //   client.updated_by = updatedBy;
  //   client.updated_at = new Date();
  //   await this.clientRepo.save(client);
  //   return this.mapToResponse(client);
  // }

  // private mapToResponse(c: Client): IClientResponse {
  //   return {
  //     id: c.id,
  //     external_id: c.external_id,
  //     full_name: [c.first_name, c.middle_name, c.last_name, c.suffix]
  //       .filter(Boolean)
  //       .join(' '),
  //     email: c.email,
  //     is_consignor: c.is_consignor,
  //     is_active: c.is_active,
  //     created_at: c.created_at,
  //   };
  // }
}
