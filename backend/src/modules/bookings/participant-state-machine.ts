import { BadRequestException } from '@nestjs/common';
import { createMachine, createActor } from 'xstate';
import { ParticipantStatus } from './entities/participant.entity';

export type ParticipantEvent =
  | { type: 'ACCEPT' }
  | { type: 'ACCEPT_FREE' }
  | { type: 'APPROVE' }
  | { type: 'APPROVE_FREE' }
  | { type: 'CANCEL' }
  | { type: 'PAY' }
  | { type: 'ENTER' }
  | { type: 'NO_SHOW' };

const ALL_EVENTS: ParticipantEvent['type'][] = [
  'ACCEPT',
  'ACCEPT_FREE',
  'APPROVE',
  'APPROVE_FREE',
  'CANCEL',
  'PAY',
  'ENTER',
  'NO_SHOW',
];

export const participantMachine = createMachine({
  id: 'participant',
  initial: ParticipantStatus.PENDING_RESPONSE,
  states: {
    [ParticipantStatus.PENDING_RESPONSE]: {
      on: {
        ACCEPT: { target: ParticipantStatus.PENDING_PAYMENT },
        ACCEPT_FREE: { target: ParticipantStatus.READY },
        CANCEL: { target: ParticipantStatus.CANCELLED },
      },
    },
    [ParticipantStatus.PENDING_APPROVAL]: {
      on: {
        APPROVE: { target: ParticipantStatus.PENDING_PAYMENT },
        APPROVE_FREE: { target: ParticipantStatus.READY },
        CANCEL: { target: ParticipantStatus.CANCELLED },
      },
    },
    [ParticipantStatus.PENDING_PAYMENT]: {
      on: {
        PAY: { target: ParticipantStatus.READY },
        CANCEL: { target: ParticipantStatus.CANCELLED },
      },
    },
    [ParticipantStatus.READY]: {
      on: {
        ENTER: { target: ParticipantStatus.ENTERED },
        CANCEL: { target: ParticipantStatus.CANCELLED },
        NO_SHOW: { target: ParticipantStatus.NO_SHOW },
      },
    },
    [ParticipantStatus.ENTERED]: {
      on: {
        NO_SHOW: { target: ParticipantStatus.NO_SHOW },
      },
    },
    [ParticipantStatus.NO_SHOW]: { type: 'final' as const },
    [ParticipantStatus.CANCELLED]: { type: 'final' as const },
  },
});

function createActorAtState(status: ParticipantStatus) {
  return createActor(participantMachine, {
    snapshot: participantMachine.resolveState({ value: status, context: {} }),
  });
}

export class ParticipantStateMachine {
  static canTransition(
    from: ParticipantStatus,
    to: ParticipantStatus,
  ): boolean {
    for (const eventType of ALL_EVENTS) {
      const actor = createActorAtState(from);
      actor.start();
      actor.send({ type: eventType });
      if (actor.getSnapshot().value === to) {
        actor.stop();
        return true;
      }
      actor.stop();
    }
    return false;
  }

  static validateTransition(
    from: ParticipantStatus,
    to: ParticipantStatus,
  ): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(
        `Invalid participant status transition from '${from}' to '${to}'`,
      );
    }
  }

  static isTerminalState(status: ParticipantStatus): boolean {
    const actor = createActorAtState(status);
    actor.start();
    const isDone = actor.getSnapshot().status === 'done';
    actor.stop();
    return isDone;
  }

  static isActiveState(status: ParticipantStatus): boolean {
    return !this.isTerminalState(status);
  }

  static isPendingState(status: ParticipantStatus): boolean {
    return [
      ParticipantStatus.PENDING_RESPONSE,
      ParticipantStatus.PENDING_APPROVAL,
      ParticipantStatus.PENDING_PAYMENT,
    ].includes(status);
  }

  static getValidTransitions(from: ParticipantStatus): ParticipantStatus[] {
    const validTargets: ParticipantStatus[] = [];

    for (const eventType of ALL_EVENTS) {
      const actor = createActorAtState(from);
      actor.start();
      actor.send({ type: eventType });
      const newState = actor.getSnapshot().value as ParticipantStatus;
      if (newState !== from && !validTargets.includes(newState)) {
        validTargets.push(newState);
      }
      actor.stop();
    }

    return validTargets;
  }
}
