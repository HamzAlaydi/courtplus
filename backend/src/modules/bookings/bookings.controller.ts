import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
  ForbiddenException,
  NotFoundException,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeaders,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { ListBookingsDto } from './dto/list-bookings.dto';
import { UserTypeGuard } from '../auth/guards/user-type.guard';
import type { SessionUser } from '../auth/@types/session';
import { BookingResponseDto } from './dto/booking-response.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ListBookingsResponseDto } from './dto/list-booking-response.dto';
import { BookingEventsService } from './events.service';
import { UserType } from '../auth/@types/user.type';
import { AuthorizedUserType } from 'src/decorators/user-type.decorator';
import { Location, UserLocation } from 'src/decorators/location.decorator';
import { Booking } from './entities/booking.entity';
import { ListBookingEventsResponseDto } from './dto/list-booking-events-response.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { ListOpenBookingsDto } from './dto/list-open-bookings.dto';
import { BOOKING_NOT_FOUND, PARTICIPANT_NOT_FOUND } from '../shared/error-codes';
import { ParticipantsDto } from './dto/participants.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { Participant } from './entities/participant.entity';
import { ParticipantsService } from './participants.service';
@Controller('bookings')
@ApiTags('Bookings')
@UseGuards(JwtAuthGuard, UserTypeGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly bookingEventsService: BookingEventsService,
    private readonly participantsService: ParticipantsService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  @ApiResponse({
    status: 200,
    description: 'The booking has been successfully created.',
  })
  create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: SessionUser,
  ) {
    if (user.type === UserType.Customer) {
      return this.bookingsService.book(createBookingDto, user);
    } else {
      return this.bookingsService.create(createBookingDto, user);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({
    status: 200,
    description: 'The bookings have been successfully retrieved.',
    type: ListBookingsResponseDto,
  })
  @ApiHeaders([
    {
      name: 'X-Location',
      description: 'The location of the user',
      example: '40.7128,-74.006',
      required: false,
    },
  ])
  find(
    @Query() query: ListBookingsDto,
    @CurrentUser() user: SessionUser,
    @Location() location: UserLocation,
  ): Promise<ListBookingsResponseDto> {
    return this.bookingsService.find(query, user, location);
  }

  @Get('open')
  @ApiOperation({ summary: 'Get all available open bookings' })
  @ApiResponse({
    status: 200,
    description: 'The bookings have been successfully retrieved.',
    type: ListBookingsResponseDto,
  })
  @ApiHeaders([
    {
      name: 'X-Location',
      description: 'The location of the user',
      example: '40.7128,-74.006',
      required: false,
    },
  ])
  findAvailableOpenBookings(
    @Query() query: ListOpenBookingsDto,
    @CurrentUser() user: SessionUser,
    @Location() location: UserLocation,
  ): Promise<ListBookingsResponseDto> {
    return this.bookingsService.find({ ...query, isLookingForOpenBookings: true }, user, location);
  }




  @Get(':id')
  @ApiOperation({ summary: 'Find a booking by id' })
  @ApiResponse({
    status: 200,
    description: 'The booking has been successfully found.',
    type: Booking,
  })
  findBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<Booking> {
    return this.bookingsService.getOne(id, user);
  }

  @Post(':id/request/respond')
  @ApiOperation({
    summary:
      'Booking Creator Accept or reject participation request for an open match',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking participation response recorded successfully',
    type: PaymentResponseDto,
  })
  @AuthorizedUserType.isCustomer()
  respondToJoinRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() responseDto: JoinRequestDto,
    @CurrentUser() user: SessionUser,
  ): Promise<void> {
    return this.bookingsService.respondToJoinRequest(id, responseDto, user);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'Accept or reject booking participation' })
  @ApiResponse({
    status: 200,
    description: 'Booking participation response recorded successfully',
    type: PaymentResponseDto,
  })
  @AuthorizedUserType.isCustomer()
  respondToBookingInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() responseDto: BookingResponseDto,
    @CurrentUser() user: SessionUser,
  ): Promise<PaymentResponseDto | void> {
    return this.bookingsService.respondToBookingInvitation(
      id,
      responseDto,
      user,
    );
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Pay for a booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking payment recorded successfully',
    type: PaymentResponseDto,
  })
  async payForBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<PaymentResponseDto> {
    const participants = await this.participantsService.getParticipants(id);
    const participant = participants.find(p => p.userId === user.id);
    if (!participant) {
      throw new NotFoundException(PARTICIPANT_NOT_FOUND);
    }
    if (!participant.booking) {
      throw new NotFoundException(BOOKING_NOT_FOUND);
    }

    participant.booking.participants = participants;
    return this.bookingsService.pay(participant);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking or leave as a participant' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
  })
  cancelBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
    @Body() body: CancelBookingDto,
  ): Promise<void> {
    return this.bookingsService.cancel(id, user, body.reason);
  }

  @Delete('booking/:id/participants/remove')
  @ApiOperation({ summary: 'Remove participant from booking' })
  @ApiResponse({
    status: 200,
    description: 'Participant removed from booking successfully',
  })
  removeParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { userIds }: ParticipantsDto,
    @CurrentUser() user: SessionUser,
  ): Promise<void> {
    return this.bookingsService.removeParticipants(id, userIds, user);
  }

  @Post('booking/:id/participants/add')
  @ApiOperation({ summary: 'Add participant to a booking' })
  @ApiResponse({
    status: 200,
    description: 'Participant added to booking successfully',
  })
  addParticipant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { userIds }: ParticipantsDto,
    @CurrentUser() user: SessionUser,
  ): Promise<void> {
    return this.bookingsService.addParticipants(id, userIds, user);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get all events for a booking' })
  @ApiResponse({
    status: 200,
    description: 'The events have been successfully retrieved.',
  })
  async getEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<ListBookingEventsResponseDto> {
    let participant: Participant | null = null;
    if (user.type === UserType.Customer) {
      participant = await this.participantsService.getParticipant(
        id,
        user.id,
      );
      if (!participant) {
        throw new ForbiddenException(
          'You are not a participant in this booking',
        );
      }
      if (!participant.booking) {
        throw new NotFoundException(BOOKING_NOT_FOUND);
      }
    } else if (user.type === UserType.Staff) {
      const booking = await this.bookingsService.findOne(
        { id },
        {
          staff: true,
          court: {
            branch: true,
          },
        },
      );
      if (booking.court.branch.tenantId !== user.tenantId) {
        throw new ForbiddenException('You are not a staff in this booking');
      }
    }
    return this.bookingEventsService.findByBookingId(id, participant);
  }

  @Post(':id/enter')
  @ApiOperation({ summary: 'Enter a booking' })
  @ApiResponse({
    status: 200,
    description: 'The booking has been successfully entered.',
  })
  @AuthorizedUserType.isCustomer()
  async enterBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<void> {
    return this.bookingsService.enterBooking(id, user);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a booking' })
  @ApiResponse({
    status: 200,
    description: 'The booking has been successfully joined.',
    type: PaymentResponseDto,
  })
  @AuthorizedUserType.isCustomer()
  async joinBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: SessionUser,
  ): Promise<PaymentResponseDto | void> {
    return this.bookingsService.joinBooking(id, user);
  }
}
