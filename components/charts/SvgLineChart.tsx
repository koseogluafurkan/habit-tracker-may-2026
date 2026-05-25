import { Platform, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/contexts/ThemeContext';

export type ChartPoint = {
  value: number;
  label: string;
};

export type ChartSeries = {
  points: ChartPoint[];
  color: string;
};

type SvgLineChartProps = {
  series: ChartSeries[];
  width?: number;
  height?: number;
  minY?: number;
  maxY?: number;
  yLabels?: string[];
};

const PADDING = { top: 12, right: 12, bottom: 28, left: 32 };

export function SvgLineChart({
  series,
  width: widthProp,
  height = 200,
  minY = 0,
  maxY = 100,
  yLabels,
}: SvgLineChartProps) {
  const t = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const width = widthProp ?? Math.min(windowWidth - 48, 900);
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) return null;

  const maxLen = Math.max(...series.map((s) => s.points.length), 1);

  const toX = (index: number, total: number) => {
    if (total <= 1) return PADDING.left + chartW / 2;
    return PADDING.left + (index / (total - 1)) * chartW;
  };

  const toY = (value: number) => {
    const range = maxY - minY || 1;
    const norm = (value - minY) / range;
    return PADDING.top + chartH - norm * chartH;
  };

  const defaultYLabels = yLabels ?? [String(minY), String(Math.round((minY + maxY) / 2)), String(maxY)];

  return (
    <Svg width={width} height={height}>
      {defaultYLabels.map((label, i) => {
        const y =
          PADDING.top + chartH - (i / Math.max(defaultYLabels.length - 1, 1)) * chartH;
        return (
          <Line
            key={`grid-${label}`}
            x1={PADDING.left}
            y1={y}
            x2={width - PADDING.right}
            y2={y}
            stroke={t.rule}
            strokeWidth={0.5}
          />
        );
      })}

      {series.map((s, si) => {
        if (s.points.length === 0) return null;
        const coords = s.points.map((p, i) => `${toX(i, s.points.length)},${toY(p.value)}`).join(' ');
        return (
          <Polyline
            key={`line-${si}`}
            points={coords}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}

      {series.map((s, si) =>
        s.points.map((p, i) => (
          <Circle
            key={`dot-${si}-${i}`}
            cx={toX(i, s.points.length)}
            cy={toY(p.value)}
            r={3.5}
            fill={s.color}
          />
        ))
      )}

      {series[0]?.points.map((p, i) => (
        <SvgText
          key={`xl-${i}`}
          x={toX(i, series[0].points.length)}
          y={height - 8}
          fontSize={9}
          fill={t.faded}
          textAnchor="middle"
          {...(Platform.OS === 'web' ? {} : {})}>
          {p.label}
        </SvgText>
      ))}

      {defaultYLabels.map((label, i) => (
        <SvgText
          key={`yl-${label}`}
          x={4}
          y={PADDING.top + chartH - (i / Math.max(defaultYLabels.length - 1, 1)) * chartH + 3}
          fontSize={9}
          fill={t.faded}>
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}
