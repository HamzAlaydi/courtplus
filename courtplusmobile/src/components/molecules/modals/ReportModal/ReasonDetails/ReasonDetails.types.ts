import { Item } from "utils";

export type ReasonDetailsProps = {
  reason: Item;
  onSubmit: (otherReason?: string) => void;
};
