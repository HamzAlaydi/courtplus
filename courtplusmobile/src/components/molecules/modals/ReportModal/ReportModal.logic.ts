import { useRef, useState } from "react";
import PagerView from "react-native-pager-view";
import { useAppStore } from "store";
import { Item } from "utils";
import { ReportModalProps, Step } from "./ReportModal.types";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useCreateReport } from "apis";

export const useReportModal = ({
  entityId,
  onClose,
  entity,
}: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState<Item | null>(null);
  const [step, setStep] = useState<Step>("list");
  const pagerRef = useRef<PagerView>(null);
  const { mutateAsync: createReport } = useCreateReport();
  const toggleLoading = useAppStore((state) => state.toggleLoading);

  const goBack = () => {
    pagerRef.current?.setPage(0);
    setSelectedReason(null);
    setStep("list");
  };

  const goDetails = (reason: Item) => {
    setSelectedReason(reason);
    pagerRef.current?.setPage(1);
    setStep("details");
  };

  const onSubmit = async (otherReason?: string) => {
    try {
      toggleLoading(true);
      await createReport({
        entityId,
        entity,
        reason: selectedReason?.key ?? "",
        description: otherReason,
      });
      onClose(true);
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };
  return {
    goDetails,
    step,
    setStep,
    selectedReason,
    setSelectedReason,
    goBack,
    pagerRef,
    onSubmit,
  };
};
