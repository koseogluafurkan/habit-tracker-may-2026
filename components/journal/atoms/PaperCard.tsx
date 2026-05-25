import { View, type ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;   // if set → left border becomes 3px in this color
};

export function PaperCard({ children, style, accentColor }: Props) {
  const t = useTheme();
  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: t.rule,
          borderLeftWidth: accentColor ? 3 : 1,
          borderLeftColor: accentColor ?? t.rule,
          padding: t.sp.md,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
