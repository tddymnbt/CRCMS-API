import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

const version = process.env.npm_package_version;

@ApiTags('status')
@Controller('status')
export class StatusController {
  @Get()
  @ApiOperation({ summary: 'Get version and status' })
  @ApiOkResponse({
    description: 'Service health status and current API version',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'Ok' },
        version: { type: 'string', example: '2.0' },
      },
    },
  })
  getVersion(): { status: string; version: string } {
    return { status: 'Ok', version };
  }
}
