import React from "react";
import { createContext, useContext, useState } from "react";
import { ColorSwitcher, AppColors } from "theme";

export enum SelectedTheme {
  LIGHT = "Light",
  DARK = "Dark",
}

type ThemeContextProps = {
  currentTheme: ColorSwitcher;
  toggleTheme: () => void;
  selectedTheme: SelectedTheme;
};

export const useThemeContext = () => useContext(ThemeContext);

const ThemeContext = createContext<ThemeContextProps>({
  currentTheme: AppColors.light,
  toggleTheme: () => {},
  selectedTheme: SelectedTheme.LIGHT,
});

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(AppColors.light);
  const [themeSelection, setThemeSelection] = useState<SelectedTheme>(
    SelectedTheme.LIGHT
  );

  const toggleTheme = () => {
    const newSelectedTheme =
      themeSelection === SelectedTheme.LIGHT
        ? SelectedTheme.DARK
        : SelectedTheme.LIGHT;

    const newTheme =
      themeSelection === SelectedTheme.LIGHT ? AppColors.dark : AppColors.light;

    setTheme(newTheme);
    setThemeSelection(newSelectedTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: theme,
        toggleTheme,
        selectedTheme: themeSelection,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
