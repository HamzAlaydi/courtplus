import { useThemeContext } from "contexts";
import { EmptyState, Header, ListActionItem } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React, { useMemo } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import styles from "./Notifications.styles";
import { useTranslation } from "react-i18next";
import { CustomButton, CustomSwitch, SkeletonLoader } from "atoms/index";
import { Images } from "theme";
import { useNotificationsSettings } from "./Notifications.logic";
import { NotificationSettings } from "apis";
import { useNavigation } from "@react-navigation/native";
import { enterRise } from "utils";

const NotificationsScreen = () => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const { t } = useTranslation();
  const { notifications, isLoading, onValueChange, notificationSettings } =
    useNotificationsSettings();
  const { goBack } = useNavigation();

  const renderList = () => {
    return (
      <>
        <Animated.View entering={enterRise(0)}>
          <ListActionItem
            overrideContainerStyle={themedStyles.listActionItem}
            overrideImageStyle={themedStyles.icon}
            list={notificationSettings.map((setting) => ({
              image: Images[setting.icon as keyof typeof Images],
              title: setting.title,
              right: (
                <CustomSwitch
                  value={
                    notifications?.[
                      setting.value as keyof NotificationSettings
                    ] ?? false
                  }
                  onValueChange={() =>
                    onValueChange(setting.value as keyof NotificationSettings)
                  }
                  overrideStyle={themedStyles.switch}
                />
              ),
            }))}
          />
        </Animated.View>
        <View style={themedStyles.bottomContainer}>
          <CustomButton
            variant="primary"
            title={t("general.done")}
            onPress={goBack}
          />
        </View>
      </>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return <SkeletonLoader />;
    }
    if (!notifications) {
      return (
        <EmptyState
          image={Images.bell}
          title={t("notifications.empty")}
          overrideImageStyle={themedStyles.emptyImage}
        />
      );
    }

    return renderList();
  };

  return (
    <MainWrapper>
      <Header whiteColor title={t("notifications.title")} />
      {renderContent()}
    </MainWrapper>
  );
};

export default NotificationsScreen;
