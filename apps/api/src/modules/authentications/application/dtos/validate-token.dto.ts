import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTokenDto {
  @ApiProperty({
    description: 'The unique identifier (JTI) of the token to be validated',
    example: 'abc123-def456-ghi789',
  })
  @IsString({ message: 'token jti is required.' })
  tokenJTI: string;
}
