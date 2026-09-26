import React, { useEffect, useMemo, useRef, useState } from "react";
import { CustomText } from "atoms/index";
import { Images } from "theme";
import { useThemeContext } from "contexts";
import styles from "./NewMatch.styles";
import {
  formatDate,
  formatTimeRange,
  Item,
  levels,
  mapGenderValue,
  SportFilterItem,
  sports,
  getMatchSizesForSport,
} from "utils";
import { AuthenticatedStackNavigationProp } from "navigation/types";
import { useNavigation } from "@react-navigation/native";
import { useOpenMatchStore } from "store";
import { useTranslation } from "react-i18next";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Image, View } from "react-native";
import { User } from "models";
import { useGetProfile } from "apis";

export const useNewMatch = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();
  // The switch is labelled "Members need to be accepted", but it used to be
  // bound straight to autoAccept — so turning it ON auto-accepted everyone,
  // the exact opposite of what the organiser was told.
  const [requiresApproval, setRequiresApproval] = useState(false);
  const autoAccept = !requiresApproval;
  const selectedDate = useOpenMatchStore((store) => store.date);
  const { t } = useTranslation();
  const levelBottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedLevel, setSelectedLevel] = useState<Item>(levels[0]);
  const selectedCourt = useOpenMatchStore((store) => store.court);
  const selectedSlots = useOpenMatchStore((store) => store.selectedSlots);
  const [playerAside, setPlayerAside] = useState<Item | null>(null);
  const clearMatchData = useOpenMatchStore((store) => store.clearMatchData);
  const addPlayersModalRef = useRef<BottomSheetModal>(null);
  const genderModalRef = useRef<BottomSheetModal>(null);
  // Default to a mixed match so the form is valid without an extra tap.
  const [selectedGender, setSelectedGender] = useState<string>("other");
  const { data: profileData } = useGetProfile();
  const [participants, setParticipants] = useState<User[]>([profileData!!]);
  const [selectedSport, setSelectedSport] = useState<SportFilterItem[]>([
    sports[1],
  ]);

  const formattedTime = formatTimeRange(selectedSlots ?? []);

  const onOpenGenderModal = () => {
    genderModalRef.current?.present();
  };

  const renderCourt = () => {
    if (!selectedCourt) {
      return (
        <CustomText
          font="chip"
          weight="medium"
          text={t("openMatch.selectLocation")}
          overrideStyle={themedStyles.description}
        />
      );
    }
    return (
      <View style={themedStyles.courtContainer}>
        <Image source={Images.openMatch} style={themedStyles.courtImage} />
        <View style={themedStyles.courtInfoContainer}>
          <CustomText
            font="bottomSheetTitle"
            weight="bold"
            text={selectedCourt?.name}
            overrideStyle={themedStyles.courtName}
          />
          {!!selectedSlots?.length && (
            <View style={themedStyles.timeContainer}>
              <View style={themedStyles.timeIconContainer}>
                <Image source={Images.clock} style={themedStyles.timeIcon} />
                <CustomText
                  font="chip"
                  weight="medium"
                  text={"Time"}
                  overrideStyle={themedStyles.description}
                />
              </View>
              <CustomText font="chip" weight="semiBold" text={formattedTime} />
            </View>
          )}
        </View>
      </View>
    );
  };

  const onPickDatePress = () => {
    navigate("PickDate");
  };

  const onPickLocationPress = () => {
    navigate("ChooseCourt");
  };

  const formattedDate = useMemo(() => {
    return selectedDate
      ? formatDate(selectedDate, "dd MMM yyyy")
      : t("openMatch.pickDay");
  }, [selectedDate]);

  const list = [
    {
      title: t("general.location"),
      subtitle: renderCourt(),
      image: Images.location2,
      onPress: onPickLocationPress,
    },
    {
      title: t("general.date"),
      subtitle: (
        <CustomText
          font="chip"
          weight="medium"
          text={formattedDate}
          overrideStyle={themedStyles.description}
        />
      ),
      image: Images.calendar2,
      onPress: onPickDatePress,
    },
    {
      title: t("openMatch.matchLevel"),
      onPress: () => levelBottomSheetRef.current?.present(),
      subtitle: (
        <CustomText
          font="chip"
          weight="medium"
          text={selectedLevel?.title ?? ""}
          overrideStyle={themedStyles.description}
        />
      ),
      image: Images.settings,
    },
    {
      title: t("general.gender"),
      subtitle: (
        <CustomText
          font="chip"
          weight="medium"
          text={
            !selectedGender
              ? t("openMatch.maleFemale")
              : mapGenderValue(selectedGender)?.title ?? ""
          }
          overrideStyle={themedStyles.description}
        />
      ),
      image: Images.gender,
      onPress: onOpenGenderModal,
    },
  ];

  const onCloseLevelModal = () => {
    levelBottomSheetRef.current?.dismiss();
  };

  const onCloseAddPlayersModal = () => {
    addPlayersModalRef.current?.dismiss();
  };

  const onOpenAddPlayersModal = () => {
    addPlayersModalRef.current?.present();
  };

  const onAddPlayer = (player: User) => {
    if (participants.length < 4) {
      setParticipants([...participants, player]);
    }
  };

  const showPlayersButton = participants.length < 4;

  const isCreteMatchButtonDisabled = useMemo(() => {
    return (
      !selectedCourt ||
      !selectedDate ||
      !selectedLevel ||
      !selectedSport[0] ||
      !playerAside
    );
  }, [participants, selectedCourt, selectedDate, selectedLevel, playerAside]);

  useEffect(() => {
    return () => {
      clearMatchData();
    };
  }, []);

  const onCreateMatchPress = () => {
    const filteredParticipants = participants.filter(
      (participant) => participant.id !== profileData?.id
    );
    navigate("ConfirmMatch", {
      autoAccept,
      gameType: playerAside?.key ?? "",
      game: selectedSport[0]!!,
      participants: filteredParticipants,
      level: selectedLevel!!,
      gender: selectedGender,
    });
  };

  const onSelectGender = (gender: string) => {
    setSelectedGender(gender);
    genderModalRef.current?.dismiss();
  };

  // Football cannot be played 2-a-side and padel cannot be played 11-a-side,
  // so the options follow the court's sport rather than being a fixed pair.
  const matchSizes = useMemo(
    () => getMatchSizesForSport(selectedCourt?.sport),
    [selectedCourt?.sport],
  );

  // A size carried over from a previous sport (2 v 2 on a football pitch)
  // would be submitted verbatim, so drop it when it is no longer offered.
  useEffect(() => {
    if (playerAside && !matchSizes.some((item) => item.key === playerAside.key)) {
      setPlayerAside(null);
    }
  }, [matchSizes, playerAside]);

  return {
    matchSizes,
    list,
    themedStyles,
    requiresApproval,
    setRequiresApproval,
    formattedDate,
    levelBottomSheetRef,
    selectedLevel,
    setSelectedLevel,
    onCloseLevelModal,
    playerAside,
    setPlayerAside,
    addPlayersModalRef,
    onCloseAddPlayersModal,
    onOpenAddPlayersModal,
    onAddPlayer,
    showPlayersButton,
    participants,
    isCreteMatchButtonDisabled,
    onCreateMatchPress,
    setSelectedSport,
    genderModalRef,
    onSelectGender,
    selectedGender,
  };
};
