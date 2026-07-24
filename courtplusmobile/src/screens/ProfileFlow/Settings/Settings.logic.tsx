import React, { useRef } from "react";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { CustomText } from "atoms/index";
import { ProfileStackNavigationProp } from "navigation/types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Images } from "theme";
import { ActionListItem, changeLanguage, clearCache, isRTL } from "utils";
import styles from "./Settings.styles";
import { Image, View } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useDeleteAccount, useGetProfile, useLogout } from "apis";
import { useAppStore } from "store";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";

const useSettings = () => {
  const { t } = useTranslation();
  const { navigate, dispatch } = useNavigation<ProfileStackNavigationProp>();
  const logoutRef = useRef<BottomSheetModal>(null);
  const deleteAccountRef = useRef<BottomSheetModal>(null);
  const changePhoneRef = useRef<BottomSheetModal>(null);
  const { data: profileData } = useGetProfile();
  const { mutateAsync: logoutMutation } = useLogout();
  const setUserTokens = useAppStore((store) => store.setUserTokens);
  const toggleLoading = useAppStore((store) => store.toggleLoading);
  const { mutateAsync: deleteAccountMutation } = useDeleteAccount();

  const handleChangePhone = () => {
    changePhoneRef.current?.present();
  };

  const handleLogout = () => {
    logoutRef.current?.present();
  };

  const handleDeleteAccount = () => {
    deleteAccountRef.current?.present();
  };

  const handlePhoneChange = () => {
    handlePhoneCancel();
    navigate("ChangePhone");
  };

  const handlePhoneCancel = () => {
    changePhoneRef.current?.dismiss();
  };

  const onCancelLogout = () => {
    logoutRef.current?.dismiss();
  };

  const onLogoutPress = async () => {
    try {
      toggleLoading(true);
      logoutRef.current?.dismiss();
      await logoutMutation();
    } catch (e) {
      return;
    } finally {
      toggleLoading(false);
      setUserTokens({
        accessToken: "",
        refreshToken: "",
      });
      clearCache();
      dispatch(
        CommonActions.reset({ index: 1, routes: [{ name: "OnboardingStack" }] })
      );
    }
  };

  const sectionData: { title?: string; data: ActionListItem[] }[] = useMemo(
    () => [
      {
        data: [
          {
            title: t("settings.saved"),
            image: Images.save,
            onPress: () => navigate("Saved"),
          },
        ],
      },
      {
        title: t("settings.settings"),
        data: [
          {
            title: t("settings.notifications"),
            image: Images.notificationBell,
            onPress: () => navigate("Notifications"),
          },
          {
            title: t("settings.changePhoneNumber"),
            image: Images.phone,
            onPress: handleChangePhone,
          },
          {
            onPress: changeLanguage,
            title: t("settings.language"),
            image: Images.internet,
            right: (
              <View style={styles.languageContainer}>
                <Image
                  source={isRTL ? Images.saudi : Images.us}
                  style={styles.languageImage}
                />
                <CustomText
                  text={!isRTL ? t("language.english") : t("language.arabic")}
                  font="chip"
                  weight="regular"
                />
              </View>
            ),
          },
          {
            title: t("settings.howCourtWorks"),
            image: Images.logo,
            onPress: () => navigate("HowCourtWorks"),
          },
        ],
      },
      {
        title: t("settings.legalInformation"),
        data: [
          {
            title: t("settings.termsOfUse"),
            image: Images.document,
            onPress: () => navigate("Terms"),
          },
          {
            title: t("settings.privacyPolicy"),
            image: Images.eye,
          },
        ],
      },
    ],
    []
  );

  const onDeleteAccount = async () => {
    try {
      deleteAccountRef.current?.dismiss();
      toggleLoading(true);
      await deleteAccountMutation();
      setUserTokens({
        accessToken: "",
        refreshToken: "",
      });
      clearCache();
      dispatch(
        CommonActions.reset({ index: 1, routes: [{ name: "OnboardingStack" }] })
      );
    } catch (e) {
      showSnackbar({ message: (e as Error).message });
      return;
    } finally {
      toggleLoading(false);
    }
  };

  const onCancelDeleteAccount = () => {
    deleteAccountRef.current?.dismiss();
  };

  return {
    sectionData,
    logoutRef,
    deleteAccountRef,
    changePhoneRef,
    profileData,
    handleLogout,
    handleDeleteAccount,
    handlePhoneChange,
    handlePhoneCancel,
    onLogoutPress,
    onCancelLogout,
    onDeleteAccount,
    onCancelDeleteAccount,
  };
};

export default useSettings;
