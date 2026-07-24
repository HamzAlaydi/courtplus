import { Report } from './entities/report.entity';

export enum ReportEvent {
  REPORT_CREATED = 'report.created',
}

export interface ReportCreatedEventPayload {
  report: Report;
}
