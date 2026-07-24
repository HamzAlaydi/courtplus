import { Injectable } from '@nestjs/common';
import { BookingEvent } from './entities/event.entity';
import { IsNull, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ListBookingEventsResponseDto } from './dto/list-booking-events-response.dto';
import { Participant } from './entities/participant.entity';

@Injectable()
export class BookingEventsService {
  constructor(
    @InjectRepository(BookingEvent)
    private readonly bookingEventRepository: Repository<BookingEvent>,
  ) { }

  async create(event: Partial<BookingEvent>) {
    await this.bookingEventRepository.save(event);
  }

  async deleteParticipantEvents(bookingId: string, userId: string) {
    await this.bookingEventRepository.softDelete({
      bookingId,
      userId,
    });
  }

  async findByBookingId(
    bookingId: string,
    participant?: Participant,
  ): Promise<ListBookingEventsResponseDto> {
    const events = await this.bookingEventRepository.find({
      where: { bookingId, deletedAt: participant?.isCreator ? undefined : IsNull() },
      select: {
        user: {
          avatarUrl: true,
          firstName: true,
          lastName: true,
        },
      },
      relations: {
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items: events,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: events.length,
      },
    };
  }
}
