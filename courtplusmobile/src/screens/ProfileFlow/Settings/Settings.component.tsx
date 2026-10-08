import { CustomText } from "atoms/index";
import {
  ChangePhoneModal,
  DeleteAccountModal,
  Header,
  ListActionItem,
  LogoutModal,
} from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { Image, View } from "react-native";
import Animated from "react-native-reanimated";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import { useThemeContext } from "contexts";
import { themedStyles as styles } from "./Settings.styles";
import useSettings from "./Settings.logic";
import { ActionListItem, enterRise, generateFullName } from "utils";

const SettingsScreen = () => {
  const { t } = useTranslation();
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);

  const {
    sectionData,
    logoutRef,
    deleteAccountRef,
    changePhoneRef,
    profileData,
    handleLogout,
    handleDeleteAccount,
    handlePhoneChange,
    handlePhoneCancel,
    onCancelLogout,
    onLogoutPress,
    onCancelDeleteAccount,
    onDeleteAccount,
  } = useSettings();

  const chevron = (
    <Image source={Images.arrowLeft} style={themedStyles.chevron} />
  );

  const withChevron = (list: ActionListItem[]): ActionListItem[] =>
    list.map((item) => ({
      ...item,
      right: (
        <View style={themedStyles.rightContainer}>
          {item.right}
          {chevron}
        </View>
      ),
    }));

  return (
    <MainWrapper
      scrollEnabled
      overrideContentStyle={themedStyles.scrollContent}
    >
      <Header whiteColor title={t("settings.title")} />
      <View style={themedStyles.content}>
        {sectionData.map(({ data, title }, index) => (
          <Animated.View
            key={`list-action-item-${index}`}
            entering={enterRise(index)}
            style={themedStyles.section}
          >
            {title && (
              <CustomText
                text={title}
                font="sectionTitle"
                weight="small"
                accessibilityRole="header"
                overrideStyle={themedStyles.title}
              />
            )}
            <ListActionItem
              list={withChevron(data)}
              overrideImageStyle={themedStyles.icon}
            />
          </Animated.View>
        ))}
        <Animated.View
          entering={enterRise(sectionData.length)}
          style={themedStyles.bottomContainer}
        >
          <ListActionItem
            list={withChevron([
              {
                title: t("settings.logout"),
                image: Images.logout,
                onPress: handleLogout,
              },
            ])}
            overrideImageStyle={themedStyles.icon}
          />
          <ListActionItem
            list={[
              {
                title: t("settings.deleteAccount"),
                image: Images.user,
                onPress: handleDeleteAccount,
              },
            ]}
            overrideImageStyle={themedStyles.dangerIcon}
            overrideTextStyle={themedStyles.dangerText}
          />
        </Animated.View>
      </View>
      <DeleteAccountModal
        ref={deleteAccountRef}
        onDeleteAccount={onDeleteAccount}
        onCancel={onCancelDeleteAccount}
      />
      <LogoutModal
        ref={logoutRef}
        username={profileData ? generateFullName(profileData) : ""}
        onLogout={onLogoutPress}
        onCancel={onCancelLogout}
      />
      <ChangePhoneModal
        ref={changePhoneRef}
        phone={profileData?.phoneNumber ?? ""}
        onChangePhone={handlePhoneChange}
        onCancel={handlePhoneCancel}
      />
    </MainWrapper>
  );
};

export default SettingsScreen;
