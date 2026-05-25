import { View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_MONO, FONT_HEADING } from '@/constants/theme';

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  large?: boolean;
};

export function StatSlot({ label, value, unit, color, large }: Props) {
  const t = useTheme();
  const c = color ?? t.ink.black;
  const valueFontSize = large ? t.fs.hero : t.fs.h1;

  return (
    <View style={{ borderBottomWidth: 1.5, borderBottomColor: c, paddingBottom: 6 }}>
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontSize: t.fs.meta,
          letterSpacing: 2.2,
          textTransform: 'uppercase',
          color: t.accent,
          marginBottom: 2,
        }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: FONT_HEADING,
          fontSize: valueFontSize,
          fontWeight: '700',
          color: c,
          lineHeight: valueFontSize * 1.05,
        }}>
        {String(value)}
        {unit ? (
          <Text style={{ color: t.accent, fontSize: valueFontSize * 0.5, fontWeight: '400' }}>
            {' '}{unit}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}
