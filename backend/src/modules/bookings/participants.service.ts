import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsRelations, FindOptionsWhere } from 'typeorm';
import { Participant, ParticipantStatus } from './entities/participant.entity';
import { UsersService } from '../users/users.service';
import { UserType } from '../auth/@types/user.type';
import { PARTICIPANT_NOT_FOUND } from '../shared/error-codes';
import { ParticipantStateMachine } from './participant-state-machine';
import type { SessionUser } from '../auth/@types/session';

@Injectable()
export class ParticipantsService {
  private readonly logger = new Logger(ParticipantsService.name);

  constructor(
    @InjectRepository(Participant)
    private readonly participantsRepository: Repository<Participant>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) { }

  async createParticipants(
    userIds: string[],
    {
      bookingId,
      creatorPaymentId,
    }: { bookingId: string; creatorPaymentId?: string },
    user: Partial<SessionUser>,
  ): Promise<Participant[]> {
    let participants: Participant[] = [];
    if (userIds.length > 0) {
      const usersCount = await this.usersService.count({
        id: In(userIds),
      });

      if (usersCount !== userIds.length) {
        throw new BadRequestException(PARTICIPANT_NOT_FOUND);
      }

      participants = userIds.map((userId) => {
        const participantEntity = new Participant();
        participantEntity.userId = userId;
        participantEntity.bookingId = bookingId;
        participantEntity.status = ParticipantStatus.PENDING_RESPONSE;
        return participantEntity;
      });
    }

    if (user.type === UserType.Customer && creatorPaymentId) {
      const creator = new Participant();
      creator.userId = user.id;
      creator.bookingId = bookingId;
      creator.isCreator = true;
      creator.paymentId = creatorPaymentId;
      creator.status = ParticipantStatus.READY;
      participants.push(creator);
    }
    participants = await this.participantsRepository.save(participants);
    return participants;
  }

  getParticipant(
    bookingId: string,
    userId: string,
    relations: FindOptionsRelations<Participant> = {
      payment: true,
      booking: true,
      user: true,
    },
  ): Promise<Participant | null> {
    return this.participantsRepository.findOne({
      where: {
        bookingId,
        userId,
      },
      relations,
    });
  }

  getParticipants(
    bookingId: string,
    relations: FindOptionsRelations<Participant> = {
      payment: true,
      booking: true,
      user: true,
    },
    where: FindOptionsWhere<Participant> = {},
  ): Promise<Participant[]> {
    return this.participantsRepository.find({
      where: { bookingId, ...where },
      relations,
    });
  }

  transitionParticipantStatus(
    participant: Participant,
    newStatus: ParticipantStatus,
  ): void {
    ParticipantStateMachine.validateTransition(participant.status, newStatus);
    this.logger.debug(
      `Participant ${participant.id} status transition: ${participant.status} -> ${newStatus}`,
    );
    participant.status = newStatus;
  }

  async save(participant: Participant): Promise<Participant> {
    return this.participantsRepository.save(participant);
  }

  async create(data: Partial<Participant>): Promise<Participant> {
    return this.participantsRepository.save(data);
  }

  async update(
    criteria: FindOptionsWhere<Participant>,
    data: Partial<Participant>,
  ) {
    return this.participantsRepository.update(criteria, data);
  }

  async delete(participantId: string): Promise<void> {
    await this.participantsRepository.delete(participantId);
  }
}
