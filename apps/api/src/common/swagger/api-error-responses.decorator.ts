import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  ApiErrorResponseDto,
  BusinessErrorResponseDto,
} from './error-response.dto';

/**
 * Documents a `400 Bad Request` produced by the global ValidationPipe
 * (whitelist / forbidNonWhitelisted / class-validator rule violations).
 */
export const ApiValidationError = (
  description = 'Validation failed. Non-whitelisted properties are rejected.',
): MethodDecorator =>
  ApiBadRequestResponse({
    description,
    type: ApiErrorResponseDto,
  });

/**
 * Documents a business error thrown by an application service with a
 * `{ status: { success: false, message } }` body.
 */
export function ApiBusinessError(
  statusCode: 400 | 404 | 409,
  description: string,
): MethodDecorator {
  const options = { description, type: BusinessErrorResponseDto };
  switch (statusCode) {
    case 400:
      return applyDecorators(ApiBadRequestResponse(options));
    case 404:
      return applyDecorators(ApiNotFoundResponse(options));
    case 409:
      return applyDecorators(ApiConflictResponse(options));
  }
}
