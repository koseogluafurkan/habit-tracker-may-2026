import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { getInkColor, getPenColor, type HabitColor } from '@/constants/theme';

type HabitCellProps = {
  color: HabitColor;
  type: 'boolean' | 'numeric';
  value?: string;
  onPress?: () => void;
  size?: number;
  readOnly?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HabitCell({ color, type, value, onPress, size = 28, readOnly }: HabitCellProps) {
  const scale = useSharedValue(1);
  const marked = type === 'boolean' ? value === 'true' : Boolean(value);
  const penColor = getPenColor(color);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (readOnly || !onPress) return;
    scale.value = withSpring(0.85, { damping: 12 }, () => {
      scale.value = withSpring(1);
    });
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={readOnly}
      style={[
        styles.cell,
        { width: size, height: size },
        marked && { backgroundColor: getInkColor(color) },
        animatedStyle,
      ]}>
      {type === 'boolean' && marked && <Text style={[styles.mark, { color: penColor }]}>✓</Text>}
      {type === 'numeric' && value ? (
        <Text style={[styles.numeric, { color: penColor }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: 0.5,
    borderColor: '#D4CFC8',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  mark: {
    fontSize: 14,
    fontWeight: '700',
  },
  numeric: {
    fontSize: 9,
    fontWeight: '600',
  },
});
