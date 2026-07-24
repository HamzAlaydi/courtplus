import { CustomText } from "atoms/index";
import {
  ChangePhoneModal,
  DeleteAccountModal,
  Header,
  ListActionItem,
  LogoutModal,
} from "molecules/index";
import { MainWrapper } from "organisms/index";
import React from "react";
import { View } from "react-native";
import { Images } from "theme";
import { useTranslation } from "react-i18next";
import styles from "./Settings.styles";
import useSettings from "./Settings.logic";
import { generateFullName } from "utils";

const SettingsScreen = () => {
  const { t } = useTranslation();

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

  return (
    <MainWrapper
      scrollEnabled={false}
      whiteBackground
      overrideContentStyle={styles.scrollContent}
    >
      <Header whiteColor title={t("settings.title")} />
      <View style={styles.content}>
        {sectionData.map(({ data, title }, index) => (
          <View key={`list-action-item-${index}`}>
            {title && (
              <CustomText
                text={title}
                font="headline3"
                weight="bold"
                overrideStyle={styles.title}
              />
            )}
            <ListActionItem list={data} />
          </View>
        ))}
        <View style={styles.bottomContainer}>
          <ListActionItem
            list={[
              {
                title: t("settings.deleteAccount"),
                image: Images.user,
                onPress: handleDeleteAccount,
              },
            ]}
          />
          <ListActionItem
            list={[
              {
                title: t("settings.logout"),
                image: Images.logout,
                onPress: handleLogout,
              },
            ]}
          />
        </View>
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
