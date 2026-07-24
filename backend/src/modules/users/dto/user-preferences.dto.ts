import { IsBoolean, IsOptional, IsISO4217CurrencyCode, IsObject, ValidateNested, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from '../entities/enums';
import { Type } from 'class-transformer';

export class NotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description:
      'Indicates if the user wants to receive notifications for new followers',
    example: true,
  })
  followers?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description:
      'Indicates if the user wants to receive notifications for new likes',
    example: true,
  })
  likes?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description:
      'Indicates if the user wants to receive notifications for new open bookings',
    example: true,
  })
  openBookings?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description:
      'Indicates if the user wants to receive notifications for booking activities',
    example: true,
  })
  bookingActivity?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description:
      'Indicates if the user wants to receive notifications for new updates',
    example: true,
  })
  updates?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description:
      'Indicates if the user wants to receive notifications for nearby courts',
    example: true,
  })
  nearbyCourts?: boolean;
}


export class UserPreferencesDto {
  @IsOptional()
  @IsEnum(Language)
  @ApiProperty({
    description: 'The language of the user',
    enum: Language,
    enumName: 'Language',
    example: Language.EN,
  })
  language?: Language;


  @IsOptional()
  @IsISO4217CurrencyCode()
  @ApiProperty({
    description: 'The currency of the user',
    example: 'USD',
  })
  currency?: string;


  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'The notifications settings of the user',
    type: NotificationSettingsDto,
  })
  @Type(() => NotificationSettingsDto)
  @ValidateNested()
  notifications?: NotificationSettingsDto;

}