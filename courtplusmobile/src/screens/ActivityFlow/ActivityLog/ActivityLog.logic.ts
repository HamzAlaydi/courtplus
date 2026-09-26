import { RouteProp, useRoute } from "@react-navigation/native";
import { useGetMatchEvents } from "apis";
import { t } from "i18next";
import { MatchEvent } from "models";
import { ActivityStackParamList } from "navigation/types";
import i18n from "translation/index";

/**
 * Turns a booking event into the sentence shown in the log.
 *
 * Every type the backend persists has an `activity.events.*` entry; anything
 * it does not recognise falls back to a generic line, so a raw enum value
 * such as `participant_join_request_submitted` is never rendered.
 */
export const getEventDescription = (event: MatchEvent) => {
  const name =
    [event.user?.firstName, event.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || t("activity.events.somePlayer");
  const key = `activity.events.${event.event}`;
  return i18n.exists(key) ? t(key, { name }) : t("activity.events.unknown");
};

export const useActivityLog = () => {
  const { params } =
    useRoute<RouteProp<ActivityStackParamList, "ActivityLog">>();
  const { id } = params;
  const {
    eventsData,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetMatchEvents({ id: id });
  return {
    eventsData,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
