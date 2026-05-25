import { useWindowDimensions, View } from 'react-native';

import { JournalTheme } from '@/constants/theme';
import type { DayEntry } from '@/db/schema';
import { getDaysInMonthCount } from '@/utils/dates';

import { GridBackground } from '../journal/GridBackground';
import { SvgLineChart } from './SvgLineChart';

type SleepChartProps = {
  year: number;
  month: number;
  dayEntries: DayEntry[];
};

export function SleepChart({ year, month, dayEntries }: SleepChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 48, 900);
  const daysCount = getDaysInMonthCount(year, month);

  const points = Array.from({ length: daysCount }, (_, i) => {
    const day = i + 1;
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = dayEntries.find((e) => e.date === dateKey);
    return entry?.sleepHours ? { value: entry.sleepHours, label: String(day) } : null;
  }).filter((p): p is { value: number; label: string } => p !== null);

  return (
    <View style={{ marginVertical: 8 }}>
      <View
        style={{
          width,
          height: 200,
          borderWidth: 1,
          borderColor: JournalTheme.border,
          overflow: 'hidden',
        }}>
        <GridBackground width={width} height={200} />
        {points.length > 0 ? (
          <SvgLineChart
            series={[{ points, color: JournalTheme.pen.blue }]}
            width={width}
            height={200}
            minY={4}
            maxY={10}
            yLabels={['4', '6', '8', '10']}
          />
        ) : null}
      </View>
    </View>
  );
}
