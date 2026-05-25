import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_CONTENT = Platform.OS === 'web' ? 72 : 56;

export function useBottomPadding(extra = 16) {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'web' ? Math.max(insets.bottom, 20) : Math.max(insets.bottom, 8);
  return TAB_BAR_CONTENT + safeBottom + extra;
}

export function useTabBarStyle() {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'web' ? Math.max(insets.bottom, 20) : Math.max(insets.bottom, 8);

  return {
    height: TAB_BAR_CONTENT + safeBottom + 12,
    paddingBottom: safeBottom + 6,
    paddingTop: 10,
    minHeight: TAB_BAR_CONTENT + safeBottom + 12,
  };
}
