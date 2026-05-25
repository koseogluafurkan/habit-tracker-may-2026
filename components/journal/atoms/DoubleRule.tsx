/**
 * DoubleRule — the 2px double bottom border used after page headers.
 * Emulated with two thin lines since RN doesn't support border-style: double.
 */
import { View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  color?: string;
  marginTop?: number;
};

export function DoubleRule({ color, marginTop = 10 }: Props) {
  const t = useTheme();
  const c = color ?? t.ink.black;
  return (
    <View style={{ marginTop, gap: 2 }}>
      <View style={{ height: 1, backgroundColor: c, opacity: 0.9 }} />
      <View style={{ height: 1, backgroundColor: c, opacity: 0.4 }} />
    </View>
  );
}
