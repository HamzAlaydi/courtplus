import { RouteProp, useRoute } from "@react-navigation/native";
import { useGetProfile } from "apis";
import { ActivityStackParamList } from "navigation/types";
import { useTranslation } from "react-i18next";
import { formatDate, generateFullName } from "utils";

export const useBookingTicket = () => {
  const { item } =
    useRoute<RouteProp<ActivityStackParamList, "BookingTicket">>().params;
  const { data: profileData } = useGetProfile();
  const { t } = useTranslation();

  const formattedStartTime = item.startDate.split("T")[1].slice(0, 5);
  const formattedEndTime = item.endDate.split("T")[1].slice(0, 5);
  const formattedTime = `${formattedStartTime} - ${formattedEndTime}`;

  const player = item.participants.find(
    (item) => item.userId === profileData?.id
  );

  const list = [
    {
      title: t("general.court"),
      value: item.court.name,
    },
    {
      title: t("general.date"),
      value: formatDate(item.startDate, "dd MMM yyyy"),
    },
    {
      title: t("general.time"),
      value: formattedTime,
    },
    {
      title: t("activity.playerName"),
      value: generateFullName(player?.user!!) ?? "",
    },
    {
      title: t("activity.playerID"),
      value: player?.id,
    },
  ];

  return {
    item,
    list,
  };
};
