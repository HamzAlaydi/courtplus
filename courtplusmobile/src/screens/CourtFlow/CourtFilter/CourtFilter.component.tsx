import { CustomButton, CustomText } from "atoms/index";
import { Header } from "molecules/index";
import { MainWrapper } from "organisms/index";
import React from "react";

const CourtFilterScreen = () => {
  return (
    <MainWrapper whiteBackground>
      <Header
        whiteColor
        title="Filters"
        overrideStyle={{
          justifyContent: "space-between",
          alignItems: "center",
        }}
        trailingComponent={
          <CustomText
            text="Clear"
            font="headline3"
            weight="medium"
            onPress={() => {}}
            overrideStyle={{
              color: "#A8B0BE",
            }}
          />
        }
      />
    </MainWrapper>
  );
};

export default CourtFilterScreen;
