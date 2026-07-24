import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { Report } from '../entities/report.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ListReportsResultDto extends EntityListResultDto<Report> {
  @ApiProperty({
    type: [Report],
    isArray: true,
    description: 'List of reports',
  })
  items: Report[];
}
