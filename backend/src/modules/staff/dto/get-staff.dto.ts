import { OmitType } from '@nestjs/swagger';
import { Staffer } from '../entities/staff.entity';

export class GetStaffDto extends OmitType(Staffer, [
  'password',
  'lastPasswordChangeAt',
]) { }
