import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const colors = {
  ink: "#211704",
  cocoa: "#60481f",
  amber: "#8a6106",
  gold: "#d8ce76",
  lime: "#dfff00",
  cream: "#fff7e8",
  surface: "#fffdf8",
  border: "#eadcae",
  success: "#2f8f46",
  danger: "#bd2f2f",
  blue: "#2f5f9f"
};

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 8,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.amber,
    secondary: colors.lime,
    background: colors.cream,
    surface: colors.surface,
    outline: colors.border,
    error: colors.danger
  }
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 8,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.gold,
    secondary: colors.lime,
    background: "#15110a",
    surface: "#211704",
    outline: "#5d4a1b"
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
};
