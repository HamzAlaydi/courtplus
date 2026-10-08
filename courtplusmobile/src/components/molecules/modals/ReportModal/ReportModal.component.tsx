import React, { forwardRef, useMemo } from "react";
import { ReportModalProps } from "./ReportModal.types";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import BottomSheetOverlay from "molecules/BottomSheetOverlay/BottomSheetOverlay.component";
import { View } from "react-native";
import { useThemeContext } from "contexts";
import styles from "./ReportModal.styles";
import ReasonList from "./ReasonList/ReasonList.component";
import ReasonDetails from "./ReasonDetails/ReasonDetails.component";
import { useReportModal } from "./ReportModal.logic";
import ReportHeader from "./ReportHeader/ReportHeader.component";
import PagerView from "react-native-pager-view";
import { useTranslation } from "react-i18next";

const ReportModal = forwardRef<BottomSheetModal, ReportModalProps>(
  ({ entityId, onClose, entity }, ref) => {
    const {
      currentTheme: { colors },
    } = useThemeContext();
    const themedStyles = useMemo(() => styles(colors), [colors]);
    const { pagerRef, step, goDetails, goBack, selectedReason, onSubmit } =
      useReportModal({ entityId, onClose, entity });
    const { t } = useTranslation();

    const snapPoints = useMemo(() => ["80%"], []);

    return (
      <BottomSheetOverlay snapPoints={snapPoints} isWhite ref={ref}>
        <ReportHeader
          title={
            step === "list" ? t("report.selectReason") : t("general.report")
          }
          showBack={step === "details"}
          onBack={goBack}
        />
        <PagerView
          ref={pagerRef}
          scrollEnabled={false}
          style={themedStyles.contentContainer}
          initialPage={0}
        >
          <View key="page-list" style={themedStyles.page}>
            <ReasonList onSelectReason={goDetails} />
          </View>

          <View key="page-details" style={themedStyles.page}>
            <ReasonDetails reason={selectedReason!!} onSubmit={onSubmit} />
          </View>
        </PagerView>
      </BottomSheetOverlay>
    );
  }
);

export default ReportModal;
