// clients.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import {
  IClient,
  IClientBankDetails,
  IClientResponse,
  IClientsResponse,
} from './interface/client-response.interface';
import { FindClientsDto } from './dto/find-all-clients.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { ClientBankDetail } from './entities/client-bank.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,

    @InjectRepository(ClientBankDetail)
    private clientBankRepo: Repository<ClientBankDetail>,
  ) {}

  async findAll(dto: FindClientsDto): Promise<IClientsResponse> {
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
        '(client.first_name ILIKE :search OR client.last_name ILIKE :search OR client.email ILIKE :search OR client.instagram ILIKE :search OR client.facebook ILIKE :search)',
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

    const [clients, total] = await query.getManyAndCount();

    const clientsWithBank = await Promise.all(
      clients.map(async (client) => {
        const { id: _, ...clientSafe } = client as Client;

        const bank = await this.clientBankRepo.findOne({
          where: { client_ext_id: client.external_id },
        });

        let bankSafe: IClientBankDetails | null = null;
        if (bank) {
          const {
            id: __,
            client_ext_id,
            created_at,
            updated_at,
            ...safeBank
          } = bank as ClientBankDetail;
          bankSafe = safeBank;
        }

        return {
          ...clientSafe,
          bank: bankSafe,
        };
      }),
    );

    return {
      status: { success: true, message: 'List of clients' },
      data: clientsWithBank,
      meta: {
        page: pageNumber,
        totalNumber: total,
        totalPages: Math.ceil(total / displayPerPage),
        displayPage: displayPerPage,
      },
    };
  }

  async findAllOLD(dto: FindClientsDto): Promise<IClientsResponse> {
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

    if (!client) {
      throw new NotFoundException({
        status: { success: false, message: 'Client not found' },
      });
    }

    const clientBank = await this.clientBankRepo.findOne({
      where: { client_ext_id: client.external_id.trim() },
    });

    // Exclude `id` and other internal fields if needed
    const { id: _, ...clientSafe } = client as Client;

    let bankSafe: IClientBankDetails | null = null;
    if (clientBank) {
      const {
        id: __,
        client_ext_id,
        created_at,
        updated_at,
        ...safeBank
      } = clientBank as ClientBankDetail;
      bankSafe = safeBank;
    }

    return {
      status: { success: true, message: 'Client details' },
      data: {
        ...clientSafe,
        bank: bankSafe,
      },
    };
  }

  async create(dto: CreateClientDto): Promise<IClientResponse> {
    const {
      first_name,
      middle_name,
      last_name,
      suffix,
      birth_date,
      email,
      bank,
    } = dto;

    await this.checkDuplicateEmail(email.trim());
    await this.checkDuplicateClient(
      first_name.trim(),
      last_name.trim(),
      birth_date,
      middle_name?.trim() || null,
      suffix?.trim() || null,
    );

    if (dto.is_consignor && !dto.bank)
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Bank details are required for the consignors.',
        },
      });

    const clientExtId = generateUniqueId(10);

    const client = this.clientRepo.create({
      ...dto,
      external_id: clientExtId,
    });
    await this.clientRepo.save(client);

    let clientBank = null;
    if (bank) {
      clientBank = this.clientBankRepo.create({
        ...bank,
        client_ext_id: clientExtId,
        created_by: dto.created_by,
      });
      await this.clientBankRepo.save(clientBank);
    }

    const clientResponse: IClient = {
      ...client,
      bank: clientBank || null,
    };

    return {
      status: { success: true, message: 'Client successfully created' },
      data: clientResponse,
    };
  }

  async checkDuplicateEmail(email: string): Promise<boolean> {
    const checkDuplicate = await this.clientRepo.findOne({
      where: { email: email.trim() },
    });
    if (checkDuplicate)
      throw new ConflictException({
        status: { success: false, message: 'Email address already exists' },
      });

    return false;
  }

  async checkDuplicateClient(
    firstName: string,
    lastName: string,
    birthDate: Date,
    middleName?: string,
    suffix?: string,
  ): Promise<boolean> {
    const where: any = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birth_date: birthDate,
    };

    if (middleName !== undefined) {
      where.middle_name = middleName.trim();
    }

    if (suffix !== undefined) {
      where.suffix = suffix.trim();
    }

    const client = await this.clientRepo.findOne({ where });

    if (client) {
      throw new ConflictException({
        status: {
          success: false,
          message: 'A client with the same details already exists',
        },
      });
    }

    return false;
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
