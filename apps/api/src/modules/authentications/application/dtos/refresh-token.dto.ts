import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh token issued during login/verify or a previous refresh call',
    example: 'YzJkOWE3ZTQtOGIxZC00Y2M1LWJmMjktZTc4YTQyNzM5YWFhLXhYWHhYWFhY',
  })
  @IsString({ message: 'refresh_token must be a string.' })
  @IsNotEmpty({ message: 'refresh_token is required.' })
  refresh_token: string;
}
