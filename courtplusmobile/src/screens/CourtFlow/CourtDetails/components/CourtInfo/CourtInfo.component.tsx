import { Carousel, SessionOverview } from "molecules/index";
import React from "react";
import { View } from "react-native";
import { Images } from "theme";
import styles from "./CourtInfo.styles";
import { CourtInfoProps } from "./CourtInfo.types";
import { useTranslation } from "react-i18next";

const CourtInfo = ({
  hourlyRate,
  minTime,
  sessions,
  assets,
}: CourtInfoProps) => {
  const { t } = useTranslation();
  const info = [
    {
      title: `${t("general.currency")} ${hourlyRate}`,
      subtitle: t("court.rate"),
      image: Images.clock,
    },
    {
      title: `${minTime} ${t("general.mins")}`,
      subtitle: t("court.mins"),
      image: Images.clock,
    },
    {
      title: `${sessions}`,
      subtitle: t("branchDetails.sessions"),
      image: Images.clock,
    },
  ];

  return (
    <View style={styles.container}>
      <Carousel
        images={assets.map((asset) => ({
          url: asset.url,
          isVideo:
            asset.mimeType?.startsWith("video") ||
            asset.type?.toLowerCase().includes("video"),
        }))}
      />
      <View style={styles.sessionOverviewContainer}>
        <SessionOverview sessions={info} />
      </View>
    </View>
  );
};

export default CourtInfo;
