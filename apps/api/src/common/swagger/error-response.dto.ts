import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseStatusDto } from './response-common.dto';

/**
 * Standard framework/validation error body returned by NestJS HttpExceptions
 * thrown with a plain string/message (e.g. ValidationPipe, guards).
 */
export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or list of validation messages',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['first_name must be a string.', 'email must be an email'],
  })
  message: string | string[];

  @ApiPropertyOptional({
    description: 'Name of the HTTP error',
    example: 'Bad Request',
  })
  error?: string;
}

/**
 * Business error body returned by application services, which throw
 * HttpExceptions with a `{ status: { success, message } }` payload.
 */
export class BusinessErrorResponseDto {
  @ApiProperty({
    description: 'Business status of the failed operation',
    type: ResponseStatusDto,
    example: {
      success: false,
      message: 'Resource not found',
    },
  })
  status: ResponseStatusDto;
}
