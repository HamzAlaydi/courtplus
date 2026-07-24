import { Transform, Type } from 'class-transformer';
import {
    IsUUID,
    IsOptional,
    IsEnum,
    Min,
    IsNumber,
    ValidateIf,
    IsLatitude,
    IsLongitude,
    IsDate,
} from 'class-validator';
import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { dayjs } from 'src/modules/shared/dayjs';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortDirection } from 'src/common/sort';
import { Sport, SportLevel, Gender } from 'src/modules/users/entities/enums';

export enum Sort {
    CREATED_AT = 'createdAt',
    START_DATE = 'startDate',
    END_DATE = 'endDate',
}

export class ListOpenBookingsDto extends PaginationInputDto {
    @ApiProperty({
        description: 'Filter matches by court ID',
        required: false,
        type: String,
        format: 'uuid',
    })
    @IsUUID()
    @IsOptional()
    courtId?: string;

    @ApiProperty({
        description: 'Filter matches by branch ID',
        required: false,
        type: String,
        format: 'uuid',
    })
    @IsUUID()
    @IsOptional()
    branchId?: string;

    @ApiProperty({
        description: 'Filter matches starting from this date (inclusive)',
        required: false,
        type: Date,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    @Transform(({ value }) => dayjs(value).utc().startOf('day').toDate())
    startDate?: Date;

    @ApiProperty({
        description: 'Filter matches ending on this date (inclusive)',
        required: false,
        type: Date,
    })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    @Transform(({ value }) => dayjs(value).utc().endOf('day').toDate())
    endDate?: Date;


    @ApiProperty({
        description: 'Filter matches by gender restriction',
        required: false,
        enum: Gender,
        enumName: 'Gender',
    })
    @IsOptional()
    @IsEnum(Gender)
    @ValidateIf((o) => o.open)
    gender?: Gender;

    @ApiProperty({
        description: 'Filter matches by skill level',
        required: false,
        enum: SportLevel,
        enumName: 'SportLevel',
    })
    @IsOptional()
    @IsEnum(SportLevel)
    @ValidateIf((o) => o.open)
    level?: SportLevel;

    @ApiProperty({
        description: 'Filter matches by sport',
        required: false,
        enum: Sport,
        enumName: 'Sport',
    })
    @IsOptional()
    @IsEnum(Sport)
    sport?: Sport;

    @ApiProperty({
        description: 'Filter matches by number of players per side',
        required: false,
        type: Number,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    playersASide?: number;

    @ValidateIf((o) => o.lat !== undefined || o.radius !== undefined)
    @IsLongitude()
    @ApiPropertyOptional({ description: 'Longitude for coordinate-based search' })
    @IsOptional()
    lng?: number;

    @ValidateIf((o) => o.lng !== undefined || o.radius !== undefined)
    @IsLatitude()
    @ApiPropertyOptional({ description: 'Latitude for coordinate-based search' })
    @IsOptional()
    lat?: number;

    @ValidateIf(
        (o) =>
            o.lng !== undefined || o.lat !== undefined || o.placeId !== undefined,
    )
    @IsNumber()
    @Min(0)
    @ApiPropertyOptional({
        description:
            'Search radius in meters. Required when using placeId or coordinates',
        minimum: 0,
    })
    @Type(() => Number)
    @IsOptional()
    radius?: number = 5000;

    @IsOptional()
    @IsEnum(Sort)
    @ApiPropertyOptional({
        description: 'Sort by',
        enum: Sort,
    })
    sortBy?: Sort = Sort.CREATED_AT;

    @IsOptional()
    @IsEnum(SortDirection)
    @ApiPropertyOptional({
        description: 'Sort direction',
        enum: SortDirection,
    })
    sortDirection?: SortDirection = SortDirection.DESC;
}
