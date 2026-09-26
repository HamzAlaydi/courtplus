import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useGetPosts, useGetProfile, useGetUserById } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { AuthenticatedStackParamList } from "navigation/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "store";
import { Images } from "theme";
import { ActionMenuItems, convertMinutesToHours, flattenData } from "utils";

export const useProfile = () => {
  const { id } =
    useRoute<RouteProp<AuthenticatedStackParamList, "Profile">>()?.params ?? {};
  // Both hooks always run (stable hook order); `me` decides ownership.
  const me = useGetProfile();
  const other = useGetUserById({ id: id ?? "" }, { enabled: !!id });
  const { data, isFetching, refetch } = id ? other : me;
  const updateProfileId = useUserStore((state) => state.updateProfileId);
  const profileId = useUserStore((state) => state.profileId);
  const [isContextActionMenuVisible, setIsContextActionMenuVisible] =
    useState(false);
  const reportModalRef = useRef<BottomSheetModal>(null);

  const isVisitingProfile = useMemo(() => {
    return !id || id === me.data?.id;
  }, [id, me.data?.id]);

  const { t } = useTranslation();
  const {
    data: postsData,
    isLoading: isPostsLoading,
    fetchNextPage: fetchNextPostsPage,
    hasNextPage: hasNextPostsPage,
    isFetchingNextPage: isFetchingNextPostsPage,
    refetch: refetchPosts,
  } = useGetPosts({ page: 1, userId: data?.id });
  const reportSubmittedModalRef = useRef<BottomSheetModal>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // The API only ever returns `bookingsCount` and `minutesBookedCount` on a
  // user. `matchesPlayedCount` / `minutesPlayedCount` are not fields it sends,
  // so those two tiles read 0 for every account — and the empty dependency
  // array froze the whole row at its first render anyway.
  const stats = data as
    | { bookingsCount?: number; minutesBookedCount?: number }
    | undefined;
  const bookingsCount = stats?.bookingsCount ?? 0;
  const minutesBookedCount = stats?.minutesBookedCount ?? 0;

  const sessions = useMemo(
    () => [
      {
        title: `${bookingsCount}`,
        subtitle: t("profile.courtsPlayed"),
        image: Images.court,
      },
      {
        title: `${convertMinutesToHours(minutesBookedCount)} ${t(
          "general.hours"
        )}`,
        subtitle: t("profile.courtsTimes"),
        image: Images.clock,
      },
    ],
    [bookingsCount, minutesBookedCount, t]
  );

  const onReportPress = () => {
    setIsContextActionMenuVisible(false);
    reportModalRef.current?.present();
  };

  const contextActionMenuItems: ActionMenuItems = useMemo(
    () => [
      {
        text: t("general.report"),
        icon: "flag",
        onPress: onReportPress,
      },
    ],
    []
  );

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([refetch(), refetchPosts()]);
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const onContextActionMenuPress = () => {
    setIsContextActionMenuVisible(true);
  };

  const onContextActionMenuClose = () => {
    setIsContextActionMenuVisible(false);
  };

  const onReportClose = (showSuccess?: boolean) => {
    reportModalRef.current?.dismiss();
    if (showSuccess) {
      reportSubmittedModalRef.current?.present();
    }
  };

  const flattenPostsData = flattenData(postsData);

  useEffect(() => {
    // Opening a stranger's profile first used to mark THEM as "me".
    if (me.data?.id && profileId !== me.data.id) {
      updateProfileId(me.data.id);
    }
  }, [me.data?.id]);

  return {
    profile: data,
    isLoading: isFetching,
    sessions,
    flattenPostsData,
    isPostsLoading,
    fetchNextPostsPage,
    hasNextPostsPage,
    isFetchingNextPostsPage,
    id,
    isVisitingProfile,
    onRefresh,
    isRefreshing,
    onContextActionMenuPress,
    onContextActionMenuClose,
    isContextActionMenuVisible,
    contextActionMenuItems,
    reportModalRef,
    onReportClose,
    reportSubmittedModalRef,
  };
};
