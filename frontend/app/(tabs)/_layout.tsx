import { Tabs } from "expo-router";
import { View } from "react-native";

import { makeStyles, useTheme } from "@/src/theme";

function Dot({ color, focused }: { color: string; focused: boolean }) {
  const styles = useStyles();
  return (
    <View
      style={[
        styles.dot,
        { backgroundColor: color, transform: [{ scale: focused ? 1 : 0.7 }] },
      ]}
    />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, focused }) => <Dot color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="highscore"
        options={{
          title: "Highscore",
          tabBarIcon: ({ color, focused }) => <Dot color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Pemain",
          tabBarIcon: ({ color, focused }) => <Dot color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const useStyles = makeStyles(() => ({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
}));
