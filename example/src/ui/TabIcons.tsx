import Svg, { Path } from 'react-native-svg';
import type { Tab } from './nav';

const PATHS: Record<Tab, string> = {
  home: 'M3 11 L12 3 L21 11 V20 a1 1 0 0 1 -1 1 H15 V15 H9 V21 H4 a1 1 0 0 1 -1 -1 Z',
  links:
    'M10 14 a5 5 0 0 0 7 0 l3 -3 a5 5 0 0 0 -7 -7 l-1 1 M14 10 a5 5 0 0 0 -7 0 l-3 3 a5 5 0 0 0 7 7 l1 -1',
  events: 'M4 19 V9 M10 19 V5 M16 19 V12 M22 19 H2',
  inapp: 'M4 5 H20 V16 H8 L4 20 Z',
};

export const ICON_PATHS = {
  back: 'M19 12 H5 M11 18 L5 12 L11 6',
  chevronUp: 'M6 15 L12 9 L18 15',
};

export function StrokeIcon({
  path,
  color,
  size = 24,
}: {
  path: string;
  color: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={path}
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TabIcon({ tab, color }: { tab: Tab; color: string }) {
  return <StrokeIcon path={PATHS[tab]} color={color} />;
}
