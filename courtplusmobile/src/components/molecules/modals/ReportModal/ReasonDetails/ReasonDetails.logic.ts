import { Item } from "utils";
import { useState } from "react";

export const useReasonDetails = (reason: Item) => {
  const [description, setDescription] = useState("");
  const showTextArea = reason?.key === "other";

  const isButtonDisabled = showTextArea && description.length === 0;

  return { showTextArea, description, setDescription, isButtonDisabled };
};
