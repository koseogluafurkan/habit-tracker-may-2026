import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import type { HabitColor } from '@/constants/theme';

type Props = {
  checked: boolean;
  color: HabitColor;       // 'black' | 'blue' | 'red'
  size?: number;           // 48 phone, 52 desktop
  onPress?: () => void;
  readOnly?: boolean;
};

export function InkCheck({ checked, color, size = 48, onPress, readOnly }: Props) {
  const t = useTheme();

  const stroke =
    color === 'blue' ? t.ink.blue
    : color === 'red' ? t.ink.red
    : t.ink.black;

  const boxFill = t.dark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.35)';

  return (
    <Pressable
      onPress={readOnly ? undefined : onPress}
      disabled={readOnly}
      hitSlop={8}
      style={{ width: size, height: size, flexShrink: 0 }}>
      <Svg viewBox="0 0 48 48" width={size} height={size}>
        {/* Hand-drawn square outline */}
        <Path
          d="M4.6 5.1 C 4.2 4.5, 5.2 4.0, 6.1 4.2 L 42.4 3.7 C 43.8 3.7, 44.2 4.6, 44.0 5.7 L 43.6 41.8 C 43.6 43.2, 42.7 43.7, 41.5 43.6 L 5.8 44.1 C 4.4 44.0, 4.0 43.0, 4.2 41.9 Z"
          fill={boxFill}
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
          opacity={0.88}
        />
        {/* Tick — black / blue habits */}
        {checked && color !== 'red' && (
          <Path
            d="M 11 25 L 21 34 L 38 13"
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* X — red (bad) habit: user slipped */}
        {checked && color === 'red' && (
          <>
            <Path d="M 12 12 L 36 36" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
            <Path d="M 36 12 L 12 36" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          </>
        )}
      </Svg>
    </Pressable>
  );
}
