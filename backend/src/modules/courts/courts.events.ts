import { Court } from './entities/court.entity';

export enum CourtEvent {
  COURT_CREATED = 'court.created',
  COURT_UPDATED = 'court.updated',
  COURT_DELETED = 'court.deleted',
  COURT_RESUBMITTED = 'court.resubmitted',
}

export class CourtEventPayload {
  court: Court;
}
