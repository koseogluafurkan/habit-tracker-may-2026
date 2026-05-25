import { View, Text, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_MONO, FONT_HEADING } from '@/constants/theme';
import type { FontSizeScale } from '@/constants/theme';

type Props = {
  eyebrow?: string;
  title: string;
  color?: string;
  action?: React.ReactNode;
  size?: keyof FontSizeScale;
  style?: ViewStyle;
};

export function SectionHeader({ eyebrow, title, color, action, size = 'h2', style }: Props) {
  const t = useTheme();
  const c = color ?? t.ink.black;

  return (
    <View style={[{ marginBottom: t.sp.md }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {eyebrow ? (
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontSize: t.fs.meta,
                letterSpacing: 2.2,
                textTransform: 'uppercase',
                color: t.accent,
                marginBottom: 2,
              }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text
            style={{
              fontFamily: FONT_HEADING,
              fontSize: t.fs[size],
              fontWeight: '700',
              color: c,
              lineHeight: t.fs[size] * 1.15,
              letterSpacing: -0.4,
            }}>
            {title}
          </Text>
        </View>
        {action ? <View>{action}</View> : null}
      </View>
      {/* Ink underline — wavy SVG */}
      <Svg
        viewBox="0 0 200 6"
        width="100%"
        height={5}
        preserveAspectRatio="none"
        style={{ marginTop: 6 }}>
        <Path
          d="M 1 3 C 50 1, 100 5, 199 2.5"
          fill="none"
          stroke={c}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
