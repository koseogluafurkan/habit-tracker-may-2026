import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  let breakpoint: Breakpoint = 'phone';
  if (width >= 1024) breakpoint = 'desktop';
  else if (width >= 640) breakpoint = 'tablet';

  return {
    width,
    height,
    breakpoint,
    isPhone: breakpoint === 'phone',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    contentMaxWidth: breakpoint === 'desktop' ? 1100 : breakpoint === 'tablet' ? 820 : width,
    columns: breakpoint === 'desktop' ? 2 : 1,
    chartWidth: Math.min(width - 48, breakpoint === 'desktop' ? 900 : width - 32),
  };
}
