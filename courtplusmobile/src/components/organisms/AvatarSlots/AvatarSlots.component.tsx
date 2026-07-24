import React from "react";
import { AvatarSlotsProps } from "./AvatarSlots.types";
import { ParticipantSlot } from "molecules/index";
import { User } from "models";

const AvatarSlots = ({
  slots,
  onRemovePress,
  showRemoveButton = true,
  showUsername = true,
}: AvatarSlotsProps) => {
  const participantSlots: (User | undefined)[] = [
    ...(slots ?? []),
    ...Array(Math.max(0, 4 - (slots?.length ?? 0))).fill(undefined),
  ];

  return participantSlots.map((slot, index) => (
    <ParticipantSlot
      key={`${slot?.username}-${index}`}
      image={slot?.avatarUrl ?? ""}
      name={slot?.firstName ?? ""}
      username={slot?.username ?? ""}
      showRemoveButton={showRemoveButton}
      showUsername={showUsername}
      onRemovePress={() => onRemovePress?.(slot!!)}
    />
  ));
};

export default AvatarSlots;
