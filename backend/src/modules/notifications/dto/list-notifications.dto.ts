import { PaginationInputDto } from 'src/common/pagination.input.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListNotificationsDto extends PaginationInputDto {
  @IsOptional()
  @IsEnum(NotificationType)
  @ApiPropertyOptional({
    enum: NotificationType,
    description: 'The type of notification to filter by',
    enumName: 'NotificationType',
  })
  type?: NotificationType;
}
