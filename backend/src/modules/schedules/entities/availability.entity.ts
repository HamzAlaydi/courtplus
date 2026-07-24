import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Schedule } from './schedule.entity';
import { dayjs } from 'src/modules/shared/dayjs';

@Entity('availabilities')
@Index('availability_schedule_idx', ['scheduleId'])
export class Availability extends BaseEntity {
  @Column('int', { array: true })
  days: number[];

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column('uuid')
  scheduleId: string;

  @ManyToOne(() => Schedule, (schedule) => schedule.availabilities)
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;

  getSlots(
    currentDate: dayjs.Dayjs,
    duration: number,
  ): { start: dayjs.Dayjs; end: dayjs.Dayjs }[] {
    const slots: { start: dayjs.Dayjs; end: dayjs.Dayjs }[] = [];
    const [startHour, startMinute] = this.startTime
      .split(':')
      .map(Number);
    const [endHour, endMinute] = this.endTime.split(':').map(Number);

    const slotStart = currentDate.hour(startHour).minute(startMinute).second(0);
    let slotEnd = currentDate.hour(endHour).minute(endMinute).second(0);

    if (slotEnd.isBefore(slotStart)) {
      slotEnd = slotEnd.add(1, 'day');
    }

    let currentSlotStart = slotStart;
    while (currentSlotStart.isBefore(slotEnd)) {
      const currentSlotEnd = currentSlotStart.add(duration, 'minutes');
      if (currentSlotEnd.isSameOrBefore(slotEnd)) {
        slots.push({
          start: currentSlotStart,
          end: currentSlotEnd,
        });
      }
      currentSlotStart = currentSlotStart.add(duration, 'minutes');
    }

    return slots;
  }
}
