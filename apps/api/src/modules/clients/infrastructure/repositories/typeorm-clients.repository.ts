import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Client } from '../../entities/client.entity';
import { ClientBankDetail } from '../../entities/client-bank.entity';
import { FindClientsDto } from '../../dto/find-all-clients.dto';
import { ClientsRepositoryPort } from '../../domain/repositories/clients.repository.port';

@Injectable()
export class TypeormClientsRepository implements ClientsRepositoryPort {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(ClientBankDetail)
    private readonly clientBankRepo: Repository<ClientBankDetail>,
  ) {}

  async findAll(dto: FindClientsDto): Promise<[Client[], number]> {
    const {
      searchValue,
      isActive = 'Y',
      isConsignor,
      pageNumber = 1,
      displayPerPage = 10,
      sortBy = 'first_name',
      orderBy = 'asc',
    } = dto;

    const query = this.clientRepo.createQueryBuilder('client');

    if (searchValue) {
      query.andWhere(
        `(client.first_name ILIKE :search
          OR client.last_name ILIKE :search
          OR client.email ILIKE :search
          OR client.instagram ILIKE :search
          OR client.facebook ILIKE :search
          OR client.contact_no ILIKE :search)`,
        { search: `%${searchValue}%` },
      );
    }

    const active = isActive?.toUpperCase() === 'Y';
    const consignor = isConsignor
      ? isConsignor.toUpperCase() === 'Y'
      : undefined;

    query.andWhere('client.is_active = :isActive', { isActive: active });

    if (consignor !== undefined) {
      query.andWhere('client.is_consignor = :isConsignor', {
        isConsignor: consignor,
      });
    }

    query.orderBy(`client.${sortBy}`, orderBy.toUpperCase() as 'ASC' | 'DESC');
    query.skip((pageNumber - 1) * displayPerPage).take(displayPerPage);

    return query.getManyAndCount();
  }

  findOne(where: FindOptionsWhere<Client>): Promise<Client | null> {
    return this.clientRepo.findOne({ where });
  }

  findClientBankByExtId(extId: string): Promise<ClientBankDetail | null> {
    return this.clientBankRepo.findOne({
      where: { client_ext_id: extId },
    });
  }

  saveClient(client: Client): Promise<Client> {
    return this.clientRepo.save(client);
  }

  createClient(payload: Partial<Client>): Client {
    return this.clientRepo.create(payload);
  }

  saveClientBank(bank: ClientBankDetail): Promise<ClientBankDetail> {
    return this.clientBankRepo.save(bank);
  }

  createClientBank(payload: Partial<ClientBankDetail>): ClientBankDetail {
    return this.clientBankRepo.create(payload);
  }

  async softDeleteClient(id: number): Promise<void> {
    await this.clientRepo.softDelete(id);
  }

  async softDeleteClientBank(id: number): Promise<void> {
    await this.clientBankRepo.softDelete(id);
  }

  countActiveClients(): Promise<number> {
    return this.clientRepo.count({
      where: { is_active: true, deleted_at: null },
    });
  }

  countActiveClientsCreatedSince(date: Date): Promise<number> {
    return this.clientRepo.count({
      where: {
        is_active: true,
        deleted_at: null,
        created_at: MoreThanOrEqual(date),
      },
    });
  }

  countActiveClientsCreatedBetween(start: Date, end: Date): Promise<number> {
    return this.clientRepo.count({
      where: {
        is_active: true,
        deleted_at: null,
        created_at: Between(start, end),
      },
    });
  }

  findClientsByBirthMonth(month: number): Promise<[Client[], number]> {
    return this.clientRepo
      .createQueryBuilder('client')
      .where('EXTRACT(MONTH FROM client.birth_date) = :month', { month })
      .andWhere('client.is_active = true')
      .andWhere('client.deleted_at IS NULL')
      .orderBy('EXTRACT(DAY FROM client.birth_date)', 'ASC')
      .skip(0)
      .take(1000)
      .getManyAndCount();
  }
}
