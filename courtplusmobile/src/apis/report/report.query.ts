import { useMutation } from "@tanstack/react-query";
import { createReport } from "./report.service";

export const useCreateReport = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createReport,
  });
  return { mutateAsync, isPending };
};
