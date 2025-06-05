import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
const version = process.env.npm_package_version;

@ApiTags('status')
@Controller('status')
export class StatusController {
  @Get()
  @ApiOperation({ summary: 'Get version and status' })
  getVersion(): { status: string; version: string } {
    return { status: 'Ok', version };
  }
}
