import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
const version = process.env.npm_package_version;

@ApiTags('status')
@Controller('status')
export class StatusController {
  @Get()
  getVersion(): { status: string; version: string } {
    return { status: 'Ok', version };
  }
}
