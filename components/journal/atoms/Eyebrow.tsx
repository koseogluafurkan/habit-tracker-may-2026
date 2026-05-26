import { Text, type TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_MONO } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
};

export function Eyebrow({ children, color, style }: Props) {
  const t = useTheme();
  return (
    <Text
      style={[
        {
          fontFamily: FONT_MONO,
          // a11y: meta is 9–10px; bump weight so it survives small size + letter-spacing
          fontSize: Math.max(t.fs.meta, 10),
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontWeight: '700',
          color: color ?? t.accent,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}
