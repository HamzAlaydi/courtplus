import { EntityListResultDto } from 'src/common/entity-list-result.dto';
import { ResponseStaff } from '../types';

export class ListStaffResponseDto extends EntityListResultDto<ResponseStaff> {
  items: ResponseStaff[];
}
