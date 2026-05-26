import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet' | 'desktop' | 'wide';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  let breakpoint: Breakpoint = 'phone';
  if (width >= 1440) breakpoint = 'wide';
  else if (width >= 1024) breakpoint = 'desktop';
  else if (width >= 640) breakpoint = 'tablet';

  // iPad Pro 12.9 portrait is 1024 — give it more room than 1100
  const contentMaxWidth =
    breakpoint === 'wide'    ? 1600 :
    breakpoint === 'desktop' ? 1400 :
    breakpoint === 'tablet'  ? Math.min(width - 16, 1000) :
                                width;

  return {
    width,
    height,
    breakpoint,
    isPhone: breakpoint === 'phone',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    isWide: breakpoint === 'wide',
    contentMaxWidth,
    columns: (breakpoint === 'desktop' || breakpoint === 'wide') ? 2 : 1,
    chartWidth: Math.min(width - 48, (breakpoint === 'desktop' || breakpoint === 'wide') ? 1100 : width - 32),
  };
}
