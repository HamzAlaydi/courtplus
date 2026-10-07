export type GenderModalProps = {
  onSelectGender: (gender: string) => void;
  isWhite?: boolean;
  selectedGender?: string;
  /**
   * Offer "Mixed" as well. Only an open match can be mixed — a person's own
   * profile gender is male or female, so this stays off by default.
   */
  includeMixed?: boolean;
};
