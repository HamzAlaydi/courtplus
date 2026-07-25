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
  const { data, isFetching, refetch } = id
    ? useGetUserById({ id })
    : useGetProfile();
  const updateProfileId = useUserStore((state) => state.updateProfileId);
  const profileId = useUserStore((state) => state.profileId);
  const [isContextActionMenuVisible, setIsContextActionMenuVisible] =
    useState(false);
  const reportModalRef = useRef<BottomSheetModal>(null);

  const isVisitingProfile = useMemo(() => {
    return id === profileId || !id;
  }, [id, profileId]);

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

  const sessions = useMemo(
    () => [
      {
        title: `${data?.matchesPlayedCount ?? "0"}`,
        subtitle: t("profile.courtsPlayed"),
        image: Images.court,
      },
      {
        title: `${convertMinutesToHours(data?.minutesPlayedCount ?? 0)} ${t(
          "general.hours"
        )}`,
        subtitle: t("profile.courtsTimes"),
        image: Images.clock,
      },
      {
        title: `${data?.bookingsCount ?? "0"}`,
        subtitle: t("profile.sessions"),
        image: Images.clipboard,
      },
    ],
    []
  );

  const onReportPress = () => {
    setIsContextActionMenuVisible(false);
    reportModalRef.current?.present();
  };

  const contextActionMenuItems: ActionMenuItems = useMemo(
    () => [
      {
        text: t("general.share"),
        icon: "share",
        onPress: () => {},
      },
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
    if (!profileId) {
      updateProfileId(data?.id ?? "");
    }
  }, [data?.id]);

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
