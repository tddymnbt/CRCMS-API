import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsWhere, Not } from 'typeorm';
import {
  IClient,
  IClientBankDetails,
  IClientCount,
  IClientResponse,
  IClientsResponse,
} from '../../interface/client-response.interface';
import { FindClientsDto } from '../../dto/find-all-clients.dto';
import { CreateClientDto } from '../../dto/create-client.dto';
import { generateUniqueId } from 'src/common/utils/gen-nanoid';
import { UpdateClientDto } from '../../dto/update-client.dto';
import { BirthMonthParamDto } from '../../dto/get-celebrant.dto';
import { UsersService } from '../../../users/users.service';
import * as moment from 'moment';
import { SharedService } from 'src/common/shared/shared.service';
import {
  CLIENTS_REPOSITORY,
  ClientsRepositoryPort,
} from '../../domain/repositories/clients.repository.port';
import { Client } from '../../entities/client.entity';
import { ClientBankDetail } from '../../entities/client-bank.entity';

@Injectable()
export class ClientsApplicationService {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly clientsRepository: ClientsRepositoryPort,
    private readonly userService: UsersService,
    private readonly sharedService: SharedService,
  ) {}

  async findAll(dto: FindClientsDto): Promise<IClientsResponse> {
    const { pageNumber = 1, displayPerPage = 10 } = dto;
    const [clients, total] = await this.clientsRepository.findAll(dto);

    const clientsWithBank = await Promise.all(
      clients.map(async (client) => this.enrichClient(client)),
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

    const client = await this.clientsRepository.findOne(whereClause);

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

    const data = await this.enrichClient(client);

    return {
      status: { success: true, message: 'Client details' },
      data,
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

    if (email && email.trim() !== '') {
      await this.checkDuplicateEmail(email.trim());
    }

    await this.checkDuplicateClient(
      first_name.trim(),
      last_name.trim(),
      birth_date,
      middle_name?.trim() || null,
      suffix?.trim() || null,
    );

    if (dto.is_consignor && !dto.bank) {
      throw new BadRequestException({
        status: {
          success: false,
          message: 'Bank details are required for the consignors.',
        },
      });
    }

    const clientExtId = generateUniqueId(10);

    const client = this.clientsRepository.createClient({
      ...dto,
      external_id: clientExtId,
    });
    await this.clientsRepository.saveClient(client);

    let clientBank: ClientBankDetail | null = null;
    if (bank) {
      clientBank = this.clientsRepository.createClientBank({
        ...bank,
        client_ext_id: clientExtId,
        created_by: dto.created_by,
      });
      await this.clientsRepository.saveClientBank(clientBank);
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

    const checkDuplicate = await this.clientsRepository.findOne(where);

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

    const client = await this.clientsRepository.findOne(where);

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
    if (!dto.updated_by) {
      throw new BadRequestException({
        status: { success: false, message: 'Updated By is required' },
      });
    }

    const client = await this.clientsRepository.findOne({
      external_id: ext_id.trim(),
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (dto.email) {
      await this.checkDuplicateEmail(dto.email.trim(), ext_id.trim());
    }

    Object.assign(client, dto);
    client.updated_at = new Date();
    client.updated_by = dto.updated_by;
    await this.clientsRepository.saveClient(client);

    if (dto.bank) {
      const existingBank = await this.clientsRepository.findClientBankByExtId(
        ext_id.trim(),
      );

      if (!existingBank) {
        const {
          account_name = null,
          account_no = null,
          bank = null,
        } = dto.bank || {};

        const clientBank = this.clientsRepository.createClientBank({
          account_name: account_name || null,
          account_no: account_no || null,
          bank: bank || null,
          client_ext_id: ext_id.trim(),
          created_by: dto.updated_by,
        });

        await this.clientsRepository.saveClientBank(clientBank);
      } else {
        Object.assign(existingBank, dto.bank);
        existingBank.updated_at = new Date();
        existingBank.updated_by = dto.updated_by;
        await this.clientsRepository.saveClientBank(existingBank);
      }
    }

    return {
      status: { success: true, message: 'Client successfully updated' },
      data: client,
    };
  }

  async remove(ext_id: string, deleted_by: string): Promise<IClientResponse> {
    if (!deleted_by) {
      throw new BadRequestException({
        status: { success: false, message: 'Deleted By is required' },
      });
    }

    const client = await this.clientsRepository.findOne({
      external_id: ext_id.trim(),
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

    await this.clientsRepository.saveClient(client);
    await this.clientsRepository.softDeleteClient(client.id);

    const clientBank = await this.clientsRepository.findClientBankByExtId(
      ext_id.trim(),
    );

    if (clientBank) {
      clientBank.is_active = false;
      clientBank.deleted_by = deleted_by;
      await this.clientsRepository.saveClientBank(clientBank);
      await this.clientsRepository.softDeleteClientBank(clientBank.id);
    }

    return {
      status: { success: true, message: 'Client successfully deleted.' },
      data: client,
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

    const [clients, total] =
      await this.clientsRepository.findClientsByBirthMonth(month);

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
      this.clientsRepository.countActiveClients(),
      this.clientsRepository.countActiveClientsCreatedSince(today),
      this.clientsRepository.countActiveClientsCreatedBetween(yesterday, today),
      this.clientsRepository.countActiveClientsCreatedSince(lastWeek),
      this.clientsRepository.countActiveClientsCreatedSince(lastMonth),
      this.clientsRepository.countActiveClientsCreatedSince(lastYear),
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

  private async enrichClient(client: Client): Promise<IClient> {
    const [bank, performedBy] = await Promise.all([
      this.clientsRepository.findClientBankByExtId(client.external_id),
      this.userService.getPerformedBy(
        client.created_by,
        client.updated_by,
        client.deleted_by,
      ),
    ]);

    const bankSafe: IClientBankDetails | null = bank
      ? ({ ...bank } as IClientBankDetails)
      : null;

    return {
      ...client,
      created_by: performedBy.data.create?.name || client.created_by || null,
      updated_by: performedBy.data.update?.name || client.updated_by || null,
      deleted_by: performedBy.data.delete?.name || client.deleted_by || null,
      bank: bankSafe,
    };
  }
}
