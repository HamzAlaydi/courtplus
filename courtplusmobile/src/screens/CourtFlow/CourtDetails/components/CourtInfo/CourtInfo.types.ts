import { Asset } from "models";

export type CourtInfoProps = {
  hourlyRate: number;
  minTime: number;
  sessions: number;
  assets: Asset[];
};
