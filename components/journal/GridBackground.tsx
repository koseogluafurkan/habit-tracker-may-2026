import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { GRID_CELL_SIZE, GRID_MAJOR_EVERY, JournalTheme } from '@/constants/theme';

type GridBackgroundProps = {
  width: number;
  height: number;
  style?: ViewStyle;
};

export function GridBackground({ width, height, style }: GridBackgroundProps) {
  const cols = Math.ceil(width / GRID_CELL_SIZE);
  const rows = Math.ceil(height / GRID_CELL_SIZE);
  const lines: React.ReactNode[] = [];

  for (let c = 0; c <= cols; c++) {
    lines.push(
      <Line
        key={`v-${c}`}
        x1={c * GRID_CELL_SIZE}
        y1={0}
        x2={c * GRID_CELL_SIZE}
        y2={height}
        stroke={c % GRID_MAJOR_EVERY === 0 ? JournalTheme.gridLineBold : JournalTheme.gridLine}
        strokeWidth={c % GRID_MAJOR_EVERY === 0 ? 0.8 : 0.4}
      />
    );
  }

  for (let r = 0; r <= rows; r++) {
    lines.push(
      <Line
        key={`h-${r}`}
        x1={0}
        y1={r * GRID_CELL_SIZE}
        x2={width}
        y2={r * GRID_CELL_SIZE}
        stroke={r % GRID_MAJOR_EVERY === 0 ? JournalTheme.gridLineBold : JournalTheme.gridLine}
        strokeWidth={r % GRID_MAJOR_EVERY === 0 ? 0.8 : 0.4}
      />
    );
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg width={width} height={height}>
        {lines}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
});
