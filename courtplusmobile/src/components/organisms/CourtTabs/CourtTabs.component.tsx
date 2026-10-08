import { useThemeContext } from "contexts";
import { Tabs } from "molecules/index";
import React, { useMemo, useState } from "react";
import Animated from "react-native-reanimated";
import { courtDetailsTabsList, enterFade } from "utils";
import styles from "./CourtTabs.styles";
import {
  CourtAvailability,
  CourtInfo,
  CourtMoments,
  CourtSpecs,
} from "screens";
import { CourtTabsProps } from "./CourtTabs.types";

const CourtTabs = ({ court }: CourtTabsProps) => {
  const {
    currentTheme: { colors },
  } = useThemeContext();
  const themedStyles = useMemo(() => styles(colors), [colors]);
  const tabs = useMemo(() => courtDetailsTabsList, []);
  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  return (
    <>
      <Tabs
        selectedTab={selectedTab}
        tabs={courtDetailsTabsList}
        setSelectedTab={setSelectedTab}
        overrideStyle={themedStyles.tabs}
      />
      <Animated.View
        key={selectedTab.key}
        entering={enterFade()}
        style={themedStyles.content}
      >
        {selectedTab.key === "details" && (
          <CourtInfo
            hourlyRate={court.hourlyRate}
            minTime={30}
            sessions={court.totalBookings}
            assets={court.assets}
          />
        )}
        {selectedTab.key === "specs" && (
          <CourtSpecs
            surface={court.surface}
            widthSingles={court.width}
            long={court.length}
            isAirConditioned={court.isAirConditioned}
            isWomenOnly={court.isWomenOnly}
          />
        )}
        {selectedTab.key === "moments" && <CourtMoments courtId={court.id} />}
        {selectedTab.key === "availability" && (
          <CourtAvailability courtId={court.id} />
        )}
      </Animated.View>
    </>
  );
};

export default CourtTabs;
