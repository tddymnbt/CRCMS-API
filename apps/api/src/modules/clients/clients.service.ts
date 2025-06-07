import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { Client } from './entities/client.entity';
import {
  IClient,
  IClientBankDetails,
  IClientCount,
  IClientResponse,
  IClientsResponse,
} from './interface/client-response.interface';
import { FindClientsDto } from './dto/find-all-clients.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { ClientBankDetail } from './entities/client-bank.entity';
import { UpdateClientDto } from './dto/update-client.dto';
import { BirthMonthParamDto } from './dto/get-celebrant.dto';
import { UsersService } from '../users/users.service';
import * as moment from 'moment';
import { SharedService } from 'src/common/shared/shared.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,

    @InjectRepository(ClientBankDetail)
    private clientBankRepo: Repository<ClientBankDetail>,

    private readonly userService: UsersService,
    private readonly sharedService: SharedService,
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
        `(client.first_name ILIKE :search 
          OR client.last_name ILIKE :search 
          OR client.email ILIKE :search 
          OR client.instagram ILIKE :search 
          OR client.facebook ILIKE :search)`,
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
        const { ...clientSafe } = client as Client;

        const [bank, performedBy] = await Promise.all([
          this.clientBankRepo.findOne({
            where: { client_ext_id: client.external_id },
          }),
          this.userService.getPerformedBy(
            client.created_by,
            client.updated_by,
            client.deleted_by,
          ),
        ]);

        let bankSafe: IClientBankDetails | null = null;
        if (bank) {
          const { ...safeBank } = bank as ClientBankDetail;
          bankSafe = safeBank;
        }

        return {
          ...clientSafe,
          created_by:
            performedBy.data.create?.name || client.created_by || null,
          updated_by:
            performedBy.data.update?.name || client.updated_by || null,
          deleted_by:
            performedBy.data.delete?.name || client.deleted_by || null,
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

  async findOne(
    ext_id: string,
    is_consigned?: boolean,
  ): Promise<IClientResponse> {
    const whereClause: FindOptionsWhere<Client> = {
      external_id: ext_id.trim(),
    };
    if (is_consigned) {
      whereClause.is_consignor = true;
    }

    const client = await this.clientRepo.findOne({ where: whereClause });

    if (!client) {
      throw new NotFoundException({
        status: {
          success: false,
          message: is_consigned
            ? 'Client must be a valid consignor'
            : 'Client not found',
        },
      });
    }

    const [clientBank, performedBy] = await Promise.all([
      this.clientBankRepo.findOne({
        where: { client_ext_id: client.external_id.trim() },
      }),
      this.userService.getPerformedBy(
        client.created_by,
        client.updated_by,
        client.deleted_by,
      ),
    ]);

    const { ...clientSafe } = client as Client;

    let bankSafe: IClientBankDetails | null = null;
    if (clientBank) {
      const { ...safeBank } = clientBank as ClientBankDetail;
      bankSafe = safeBank;
    }

    return {
      status: { success: true, message: 'Client details' },
      data: {
        ...clientSafe,
        created_by: performedBy.data.create?.name || client.created_by || null,
        updated_by: performedBy.data.update?.name || client.updated_by || null,
        deleted_by: performedBy.data.delete?.name || client.deleted_by || null,
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

  async checkDuplicateEmail(email: string, ext_id?: string): Promise<boolean> {
    const where: FindOptionsWhere<Client> = {
      email: email.trim(),
      ...(ext_id && { external_id: Not(ext_id.trim()) }),
    };

    const checkDuplicate = await this.clientRepo.findOne({ where });

    if (checkDuplicate) {
      throw new ConflictException({
        status: { success: false, message: 'Email address already exists' },
      });
    }

    return false;
  }
  async checkDuplicateClient(
    firstName: string,
    lastName: string,
    birthDate: Date,
    middleName?: string,
    suffix?: string,
  ): Promise<boolean> {
    const where: Partial<Client> = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birth_date: birthDate,
    };

    if (typeof middleName === 'string' && middleName.trim() !== '') {
      where.middle_name = middleName.trim();
    }

    if (typeof suffix === 'string' && suffix.trim() !== '') {
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

  async update(ext_id: string, dto: UpdateClientDto): Promise<IClientResponse> {
    if (!dto.updated_by)
      throw new BadRequestException({
        status: { success: false, message: 'Updated By is required' },
      });

    const client: Client = await this.clientRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    // await this.checkDuplicateClient(
    //   dto.first_name.trim(),
    //   dto.last_name.trim(),
    //   dto.birth_date,
    //   dto.middle_name?.trim() || null,
    //   dto.suffix?.trim() || null,
    // );

    if (dto.email)
      await this.checkDuplicateEmail(dto.email?.trim(), ext_id.trim());

    Object.assign(client, dto);
    client.updated_at = new Date();
    client.updated_by = dto.updated_by;
    await this.clientRepo.save(client);

    let clientBank: ClientBankDetail;
    if (dto.bank) {
      clientBank = await this.clientBankRepo.findOne({
        where: { client_ext_id: ext_id.trim() },
      });

      if (!clientBank) {
        const {
          account_name = null,
          account_no = null,
          bank = null,
        } = dto.bank || {};

        clientBank = this.clientBankRepo.create({
          account_name: account_name || null,
          account_no: account_no || null,
          bank: bank || null,
          client_ext_id: ext_id.trim(),
          created_by: dto.updated_by,
        });

        await this.clientBankRepo.save(clientBank);
      } else {
        Object.assign(clientBank, dto.bank);
        clientBank.updated_at = new Date();
        clientBank.updated_by = dto.updated_by;
        await this.clientBankRepo.save(clientBank);
      }
    }

    return {
      status: { success: true, message: 'Client successfully updated' },
      data: client,
    };
  }

  async remove(ext_id: string, deleted_by: string): Promise<IClientResponse> {
    if (!deleted_by)
      throw new BadRequestException({
        status: { success: false, message: 'Deleted By is required' },
      });

    const client = await this.clientRepo.findOne({
      where: { external_id: ext_id.trim() },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const hasSales = await this.sharedService.checkTransactionByClientOrStock(
      client.external_id,
    );
    if (hasSales) {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Cannot delete: existing transactions found.',
        },
      });
    }

    client.is_active = false;
    client.deleted_by = deleted_by;

    await this.clientRepo.save(client);

    await this.clientRepo.softDelete(client.id);

    const clientBank = await this.clientBankRepo.findOne({
      where: { client_ext_id: ext_id.trim() },
    });

    if (clientBank) {
      clientBank.is_active = false;
      clientBank.deleted_by = deleted_by;
      await this.clientBankRepo.save(clientBank);
      await this.clientBankRepo.softDelete(clientBank.id);
    }

    return {
      status: { success: true, message: 'Client successfully deleted.' },
    };
  }

  async getClientsByBirthMonth(
    dto: BirthMonthParamDto,
  ): Promise<IClientsResponse> {
    const { month = 1 } = dto;
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const query = this.clientRepo
      .createQueryBuilder('client')
      .where('EXTRACT(MONTH FROM client.birth_date) = :month', { month })
      .andWhere('client.is_active = true')
      .andWhere('client.deleted_at IS NULL')
      .orderBy('EXTRACT(DAY FROM client.birth_date)', 'ASC')
      .skip((1 - 1) * 1000)
      .take(1000);

    const [clients, total] = await query.getManyAndCount();

    return {
      status: {
        success: true,
        message: `List of celebrant/s for the month of ${months[month - 1]}`,
      },
      data: clients,
      meta: {
        page: 1,
        totalNumber: total,
        totalPages: Math.ceil(total / 1000),
        displayPage: 1000,
      },
    };
  }

  async getClientCounts(): Promise<IClientCount> {
    const today = moment().startOf('day').toDate();
    const yesterday = moment().subtract(1, 'day').startOf('day').toDate();
    const lastWeek = moment().subtract(7, 'days').startOf('day').toDate();
    const lastMonth = moment().subtract(30, 'days').startOf('day').toDate();
    const lastYear = moment().subtract(365, 'days').startOf('day').toDate();

    const [
      totalCount,
      todayCount,
      yesterdayCount,
      lastWeekCount,
      lastMonthCount,
      lastYearCount,
    ] = await Promise.all([
      this.clientRepo.count({ where: { is_active: true, deleted_at: null } }),
      this.clientRepo.count({
        where: {
          is_active: true,
          deleted_at: null,
          created_at: MoreThanOrEqual(today),
        },
      }),
      this.clientRepo.count({
        where: {
          is_active: true,
          deleted_at: null,
          created_at: Between(yesterday, today),
        },
      }),
      this.clientRepo.count({
        where: {
          is_active: true,
          deleted_at: null,
          created_at: MoreThanOrEqual(lastWeek),
        },
      }),
      this.clientRepo.count({
        where: {
          is_active: true,
          deleted_at: null,
          created_at: MoreThanOrEqual(lastMonth),
        },
      }),
      this.clientRepo.count({
        where: {
          is_active: true,
          deleted_at: null,
          created_at: MoreThanOrEqual(lastYear),
        },
      }),
    ]);

    return {
      status: {
        success: true,
        message: 'Successfully fetched data',
      },
      data: {
        totalCount: totalCount.toString(),
        todayCount: todayCount.toString(),
        yesterdayCount: yesterdayCount.toString(),
        lastWeekCount: lastWeekCount.toString(),
        lastMonthCount: lastMonthCount.toString(),
        lastYearCount: lastYearCount.toString(),
      },
    };
  }
}
