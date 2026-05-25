import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { JournalTheme } from '@/constants/theme';
import { useTabBarStyle } from '@/hooks/useBottomPadding';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.55, color: focused ? JournalTheme.accent : JournalTheme.textMuted }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  const tabBarStyle = useTabBarStyle();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: JournalTheme.accent,
        tabBarInactiveTintColor: JournalTheme.textMuted,
        tabBarStyle: {
          backgroundColor: JournalTheme.background,
          borderTopColor: JournalTheme.border,
          borderTopWidth: 1,
          ...tabBarStyle,
        },
        tabBarItemStyle: {
          paddingTop: 4,
          paddingBottom: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
          title: 'Daily',
          tabBarIcon: ({ focused }) => <TabIcon label="☀" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Month',
          tabBarIcon: ({ focused }) => <TabIcon label="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="graphs"
        options={{
          title: 'Graphs',
          tabBarIcon: ({ focused }) => <TabIcon label="📈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          title: 'Setup',
          tabBarIcon: ({ focused }) => <TabIcon label="⚙" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
