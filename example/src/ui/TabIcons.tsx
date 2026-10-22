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
  chevronRight: 'M9 6 L15 12 L9 18',
  gear: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
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
