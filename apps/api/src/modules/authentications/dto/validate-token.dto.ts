import { IsString } from 'class-validator';

export class ValidateTokenDto {
  @IsString({ message: 'token jti is required.' })
  tokenJTI: string;
}
