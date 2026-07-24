import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export enum BranchInclude {
  COURTS = 'courts',
}

export class GetBranchDto {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Whether to include courts in the response',
    example: false,
    required: false,
    type: 'boolean',
  })
  @Transform(({ value }) => value === 'true')
  includeCourts?: boolean = false;
}
