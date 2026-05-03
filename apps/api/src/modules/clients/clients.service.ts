import { Injectable } from '@nestjs/common';
import { ClientsApplicationService } from './application/services/clients.application.service';

@Injectable()
export class ClientsService extends ClientsApplicationService {}
