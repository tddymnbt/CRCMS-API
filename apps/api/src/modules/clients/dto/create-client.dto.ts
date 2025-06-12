import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateClientBankDTO {
  @ApiProperty({
    description: 'Account Name',
    example: 'TESTACCOUNT001',
  })
  @IsString({ message: 'account_name must be a string.' })
  @IsNotEmpty({ message: 'account_name is required.' })
  account_name: string;

  @ApiProperty({
    description: 'Account Number',
    example: '1234657890123',
  })
  @IsString({ message: 'account_no must be a string.' })
  @IsNotEmpty({ message: 'account_no is required.' })
  account_no: string;

  @ApiProperty({
    description: 'Bank Provider',
    example: 'BPI/BDO/Metrobank',
  })
  @IsString({ message: 'bank must be a string.' })
  @IsNotEmpty({ message: 'bank is required.' })
  bank: string;
}

export class CreateClientDto {
  @ApiProperty({
    description: 'First name of the client',
    example: 'John',
  })
  @IsString({ message: 'first_name must be a string.' })
  @IsNotEmpty({ message: 'first_name is required.' })
  first_name: string;

  @ApiPropertyOptional({
    description: 'Middle name of the client',
    example: 'Marquez',
  })
  @IsOptional()
  @IsString({ message: 'middle_name must be a string.' })
  middle_name?: string;

  @ApiProperty({
    description: 'Last name of the client',
    example: 'Cruz',
  })
  @IsString({ message: 'last_name must be a string.' })
  @IsNotEmpty({ message: 'last_name is required.' })
  last_name: string;

  @ApiPropertyOptional({
    description: 'Suffix of the client',
    example: 'Jr.',
  })
  @IsOptional()
  @IsString({ message: 'suffix must be a string.' })
  suffix?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1999-04-01',
  })
  @IsDateString({}, { message: 'birth_date must be a valid date' })
  @IsNotEmpty({ message: 'birth_date is required.' })
  birth_date: Date;

  @ApiProperty({
    description: 'Email address of the client',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  @IsString({ message: 'email must be a string.' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact Number',
    example: '09123456789',
  })
  @IsNotEmpty({ message: 'contact_no is required.' })
  @IsString({ message: 'contact_no must be a string.' })
  contact_no: string;

  @ApiPropertyOptional({
    description: "Client's full address",
    example: 'Block#, Street #, Somewhere, City, Province, State',
  })
  @IsOptional()
  @IsString({ message: 'address must be a string.' })
  address?: string;

  @ApiPropertyOptional({
    description: "Client's instagram account profile link",
    example: 'https://www.instagram.com/test',
  })
  @IsNotEmpty({ message: 'instagram is required.' })
  @IsString({ message: 'instagram must be a string.' })
  instagram: string;

  @ApiPropertyOptional({
    description: "Client's facebook account profile link",
    example: 'https://www.facebook.com/test',
  })
  @IsOptional()
  @IsString({ message: 'facebook must be a string.' })
  facebook?: string;

  @ApiProperty({
    description: 'Set client as consignor',
    example: 'false',
  })
  @IsBoolean()
  @IsNotEmpty({ message: 'is_consignor is required.' })
  is_consignor: boolean;

  @ApiProperty({
    description: 'Created by',
    example: 'system',
  })
  @IsString({ message: 'created_by must be a string.' })
  @IsNotEmpty({ message: 'created_by is required.' })
  created_by: string;

  @ApiProperty({
    description: 'Client bank details',
    type: () => CreateClientBankDTO,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateClientBankDTO)
  bank: CreateClientBankDTO;
}
