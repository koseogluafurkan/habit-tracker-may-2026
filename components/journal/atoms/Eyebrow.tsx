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
          fontSize: t.fs.meta,
          letterSpacing: 2.2,
          textTransform: 'uppercase',
          color: color ?? t.accent,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}
