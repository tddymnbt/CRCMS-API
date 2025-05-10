import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('authenticators')
@Controller('authenticators')
export class AuthenticatorsController {
  constructor() {}
}
