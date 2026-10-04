// Design tokens for this app. Light theme only — bright, kid-friendly
// blue/green palette for "Petualangan Angka".
//
// The keys match the "color" block of the design guidelines. A plain key is a
// background and its `on` partner is the text/icon color that sits on top.
// Build StyleSheets with makeStyles(); read useTheme().colors for color props.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // Surfaces
  surface: "#FFFFFF",
  onSurface: "#0F2744",
  surfaceSecondary: "#F1F7FF",
  onSurfaceSecondary: "#1E3A5F",
  surfaceTertiary: "#E8F0FE",
  onSurfaceTertiary: "#334E68",
  surfaceInverse: "#0F2744",
  onSurfaceInverse: "#FFFFFF",
  muted: "#5B7795",

  // Brand (bright blue + green)
  brand: "#2E7DF6",
  onBrand: "#FFFFFF",
  brandPrimary: "#2E7DF6",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#22C55E",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#DCFCE7",
  onBrandTertiary: "#166534",

  // Status
  success: "#16A34A",
  onSuccess: "#FFFFFF",
  warning: "#D97706",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",
  info: "#2563EB",
  onInfo: "#FFFFFF",

  // Lines
  border: "#D6E4F5",
  borderStrong: "#9DBFE8",
  divider: "#E6EEF8",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
