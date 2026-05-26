import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="morning" options={{ title: 'Morning' }} />
      <Tabs.Screen name="index"   options={{ title: 'Daily' }} />
      <Tabs.Screen name="journal" options={{ title: 'Month' }} />
      <Tabs.Screen name="graphs"  options={{ title: 'Graphs' }} />
      <Tabs.Screen name="setup"   options={{ title: 'Setup' }} />
    </Tabs>
  );
}
