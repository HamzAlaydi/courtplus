import { Sport } from "models";

export type SportsLevelManagerProps = {
  sports: Sport[];
  isEditMode?: boolean;
  isCompleteProfile?: boolean;
};
