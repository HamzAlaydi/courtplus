import { PrimaryGeneratedColumn } from 'typeorm';
import { DateEntity } from './date-entity';

export abstract class BaseEntity extends DateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
