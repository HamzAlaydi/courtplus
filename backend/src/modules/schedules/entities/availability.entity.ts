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

    // isSameOrBefore, not isBefore. An equal start and end means the venue is
    // open around the clock (00:00-00:00, or 09:00-09:00 for a day that rolls
    // over). With a plain isBefore the end never moved past the start, the
    // loop below ran zero times, and the court silently produced NO bookable
    // slots at all — it looked configured but could never be booked.
    if (slotEnd.isSameOrBefore(slotStart)) {
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
