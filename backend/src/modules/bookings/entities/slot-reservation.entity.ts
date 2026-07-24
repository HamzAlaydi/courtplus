import { Column, Entity, Index, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { DateEntity } from 'src/common/date-entity';
import { Court } from 'src/modules/courts/entities/court.entity';

@Entity('slot_reservations')
@Index('slot_reservation_court_dates_idx', ['courtId', 'startDate', 'endDate'])
@Index('slot_reservation_expires_idx', ['expiresAt'])
export class SlotReservation extends DateEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  courtId: string;

  @Column('uuid')
  userId: string;

  @Column('timestamptz')
  startDate: Date;

  @Column('timestamptz')
  endDate: Date;

  @Column('timestamptz')
  expiresAt: Date;

  @ManyToOne(() => Court, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courtId' })
  court?: Court;
}
