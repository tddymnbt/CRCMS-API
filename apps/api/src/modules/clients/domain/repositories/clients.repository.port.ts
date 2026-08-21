import { FindOptionsWhere } from 'typeorm';
import { Client } from '../entities/client.entity';
import { ClientBankDetail } from '../entities/client-bank.entity';
import { FindClientsDto } from '../../application/dtos/find-all-clients.dto';

export const CLIENTS_REPOSITORY = Symbol('CLIENTS_REPOSITORY');

export interface ClientsRepositoryPort {
  findAll(dto: FindClientsDto): Promise<[Client[], number]>;
  findOne(where: FindOptionsWhere<Client>): Promise<Client | null>;
  findClientBankByExtId(extId: string): Promise<ClientBankDetail | null>;
  saveClient(client: Client): Promise<Client>;
  createClient(payload: Partial<Client>): Client;
  saveClientBank(bank: ClientBankDetail): Promise<ClientBankDetail>;
  createClientBank(payload: Partial<ClientBankDetail>): ClientBankDetail;
  softDeleteClient(id: number): Promise<void>;
  softDeleteClientBank(id: number): Promise<void>;
  countActiveClients(): Promise<number>;
  countActiveClientsCreatedSince(date: Date): Promise<number>;
  countActiveClientsCreatedBetween(start: Date, end: Date): Promise<number>;
  findClientsByBirthMonth(month: number): Promise<[Client[], number]>;
}
