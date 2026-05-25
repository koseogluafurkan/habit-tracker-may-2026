import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTabBarStyle } from '@/hooks/useBottomPadding';

function TabIcon({ label, focused, accent, faded }: { label: string; focused: boolean; accent: string; faded: string }) {
  return (
    <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.55, color: focused ? accent : faded }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const t = useTheme();
  const tabBarStyle = useTabBarStyle();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.faded,
        tabBarStyle: {
          backgroundColor: t.paper,
          borderTopColor: t.rule,
          borderTopWidth: 1,
          ...tabBarStyle,
        },
        tabBarItemStyle: {
          paddingTop: 4,
          paddingBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: FONT_MONO,
          letterSpacing: 1.5,
          marginBottom: 0,
          lineHeight: 14,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'DAILY',
          tabBarIcon: ({ focused }) => <TabIcon label="☀" focused={focused} accent={t.accent} faded={t.faded} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'MONTH',
          tabBarIcon: ({ focused }) => <TabIcon label="📖" focused={focused} accent={t.accent} faded={t.faded} />,
        }}
      />
      <Tabs.Screen
        name="graphs"
        options={{
          title: 'GRAPHS',
          tabBarIcon: ({ focused }) => <TabIcon label="📈" focused={focused} accent={t.accent} faded={t.faded} />,
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          title: 'SETUP',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙" focused={focused} accent={t.accent} faded={t.faded} />,
        }}
      />
    </Tabs>
  );
}
