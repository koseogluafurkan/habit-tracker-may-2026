/**
 * GridOverlay — renders the graph-paper grid aesthetic.
 * Position absolute, inset 0, pointerEvents none.
 * Uses react-native-svg Pattern for a proper tiled grid.
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  cellSize?: number;
};

export function GridOverlay({ cellSize = 24 }: Props) {
  const t = useTheme();
  if (t.aesthetic !== 'grid') return null;

  const color = t.dark ? 'rgba(216,182,106,0.10)' : 'rgba(139,111,71,0.13)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id="grid"
            width={cellSize}
            height={cellSize}
            patternUnits="userSpaceOnUse">
            <Line x1={cellSize} y1="0" x2={cellSize} y2={cellSize} stroke={color} strokeWidth="1" />
            <Line x1="0" y1={cellSize} x2={cellSize} y2={cellSize} stroke={color} strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
    </View>
  );
}
