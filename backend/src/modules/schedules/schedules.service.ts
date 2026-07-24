import {
  BadRequestException,
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateUpdateScheduleDto } from './dto/create-update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Availability } from './entities/availability.entity';
import {
  OVERLAPPING_AVAILABILITIES,
  SCHEDULE_NOT_FOUND,
} from '../shared/error-codes';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
    @InjectRepository(Availability)
    private readonly availabilitiesRepository: Repository<Availability>,

    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  @Transactional()
  async create(
    { availabilities, timeZone }: CreateUpdateScheduleDto,
    entityId: string,
    isForBranch: boolean,
  ) {
    if (!this.isValidAvailabilities(availabilities)) {
      throw new BadRequestException(OVERLAPPING_AVAILABILITIES);
    }

    const schedule = await this.schedulesRepository.save({
      timeZone,
      ...(isForBranch ? { branchId: entityId } : { courtId: entityId }),
    });

    if (availabilities?.length) {
      const availabilitiesEntities = availabilities.map(
        ({ days, endTime, startTime }) => {
          const newAvailability = new Availability();
          newAvailability.days = days;
          newAvailability.startTime = startTime;
          newAvailability.endTime = endTime;
          newAvailability.scheduleId = schedule.id;
          return newAvailability;
        }
      );

      await this.availabilitiesRepository.save(availabilitiesEntities);
    }

    return schedule;
  }

  async findOne(id: string) {
    const cacheKey = `schedule:${id}`;
    const cachedSchedule = await this.cacheManager.get<Schedule>(cacheKey);

    if (cachedSchedule) {
      return cachedSchedule;
    }

    const schedule = await this.schedulesRepository.findOne({
      where: { id },
      relations: {
        availabilities: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException(SCHEDULE_NOT_FOUND);
    }

    await this.cacheManager.set(cacheKey, schedule);

    return schedule;
  }

  @Transactional()
  async update(id: string, { availabilities, timeZone }: CreateUpdateScheduleDto) {
    if (!this.isValidAvailabilities(availabilities)) {
      throw new BadRequestException(OVERLAPPING_AVAILABILITIES);
    }

    const schedule = await this.schedulesRepository.findOne({
      where: { id },
      relations: ['availabilities'],
    });

    if (!schedule) {
      throw new NotFoundException(SCHEDULE_NOT_FOUND);
    }

    if (timeZone) {
      await this.schedulesRepository.update(
        { id },
        { timeZone },
      );
    }

    const newAvailabilities =
      availabilities?.map((availability) => ({
        ...availability,
        scheduleId: id,
      })) || [];

    if (schedule.availabilities?.length) {
      await this.availabilitiesRepository.remove(schedule.availabilities);
    }

    if (newAvailabilities.length) {
      await this.availabilitiesRepository.save(newAvailabilities);
    }
    await this.cacheManager.del(`schedule:${id}`);
    return this.findOne(id);
  }

  isValidAvailabilities(
    availabilities: Pick<Availability, 'days' | 'startTime' | 'endTime'>[],
  ) {
    if (!availabilities?.length) return true;

    const groupedAvailabilities =
      this.groupAvailabilitiesByTimeSpan(availabilities);

    for (let i = 0; i < groupedAvailabilities.length; i++) {
      const groupA = groupedAvailabilities[i];

      for (let j = i + 1; j < groupedAvailabilities.length; j++) {
        const groupB = groupedAvailabilities[j];
        const overlappingDays = groupA.days.filter((day) =>
          groupB.days.includes(day),
        );

        if (overlappingDays.length === 0) continue;

        const aStart = this.timeToMinutes(groupA.startTime);
        const aEnd = this.timeToMinutes(groupA.endTime);
        const bStart = this.timeToMinutes(groupB.startTime);
        const bEnd = this.timeToMinutes(groupB.endTime);

        const aCrossesMidnight = aEnd <= aStart;
        const bCrossesMidnight = bEnd <= bStart;

        const aEndAdjusted = aCrossesMidnight ? aEnd + 24 * 60 : aEnd;
        const bEndAdjusted = bCrossesMidnight ? bEnd + 24 * 60 : bEnd;

        if (aStart < bEndAdjusted && aEndAdjusted > bStart) {
          return false;
        }
      }
    }

    return true;
  }

  private groupAvailabilitiesByTimeSpan(
    availabilities: Pick<Availability, 'days' | 'startTime' | 'endTime'>[],
  ): Pick<Availability, 'days' | 'startTime' | 'endTime'>[] {
    const timeSpanMap = new Map<string, Set<number>>();

    availabilities.forEach((availability) => {
      const timeSpanKey = `${availability.startTime}-${availability.endTime}`;
      if (!timeSpanMap.has(timeSpanKey)) {
        timeSpanMap.set(timeSpanKey, new Set());
      }
      availability.days.forEach((day) => timeSpanMap.get(timeSpanKey).add(day));
    });

    return Array.from(timeSpanMap.entries()).map(([timeSpan, days]) => {
      const [startTime, endTime] = timeSpan.split('-');
      return {
        startTime,
        endTime,
        days: Array.from(days).sort(),
      };
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
  }
}
