import { useMemo, useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, Text } from 'react-native';
import type { LogEntry } from '../../actions/log';
import { formatClock } from '../../data/strings';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { StatusDot } from '../controls/Basics';
import { ICON_PATHS, StrokeIcon } from '../TabIcons';

const DRAG_OPEN_DISTANCE = 8;

/** The newest log entry above the tab bar. Tap or drag up to open the logs panel. */
export function ConsoleStrip({
  latest,
  unseenError,
  onOpen,
}: {
  latest?: LogEntry;
  unseenError: boolean;
  onOpen: () => void;
}) {
  const { colors } = useTheme();
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          g.dy < -DRAG_OPEN_DISTANCE && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => onOpenRef.current(),
      }),
    []
  );
  return (
    <Pressable
      {...pan.panHandlers}
      onPress={onOpen}
      testID="consoleStrip"
      accessibilityRole="button"
      accessibilityLabel="Open logs"
      style={[
        styles.strip,
        { backgroundColor: colors.surface, borderTopColor: colors.border },
      ]}
    >
      <StatusDot
        state={unseenError ? 'error' : (latest?.state ?? 'neutral')}
        testID="consoleStripDot"
      />
      <Text
        numberOfLines={1}
        style={[type.caption, styles.title, { color: colors.text }]}
      >
        {latest?.title ?? 'No events yet'}
      </Text>
      {latest ? (
        <Text style={[type.caption, { color: colors.textFaint }]}>
          {formatClock(latest.time)}
        </Text>
      ) : null}
      <StrokeIcon
        path={ICON_PATHS.chevronUp}
        color={colors.textFaint}
        size={16}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  title: { flex: 1 },
});
