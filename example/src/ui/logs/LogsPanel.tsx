import { memo, useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { exportLog } from '../../actions/exportLog';
import {
  LOG_FILTERS,
  matchesFilter,
  type LogEntry,
  type LogFilter,
  type TestAction,
} from '../../actions/log';
import { appLog } from '../../actions/testLog';
import { runAction } from '../../actions/testRunner';
import { formatClock } from '../../data/strings';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { copyToClipboard, StatusDot } from '../controls/Basics';
import { AppButton, MIN_TOUCH, TextAction } from '../controls/Buttons';
import { Chip } from '../controls/Chips';
import { Sheet } from '../controls/Sheet';
import { ICON_PATHS, StrokeIcon } from '../TabIcons';
import { useLog } from '../useStore';
import { deviceInfo } from './deviceInfo';

const isRepeatable = (action?: TestAction): action is TestAction =>
  action !== undefined && action.repeatable !== false;

const rerun = (action: TestAction) => {
  runAction(appLog, action);
};

const codeOf = (entry: LogEntry) => entry.code || entry.detail;

export function LogsPanel({
  visible,
  onClose,
  focusEntryId,
  onInspect,
}: {
  visible: boolean;
  onClose: () => void;
  focusEntryId?: number;
  onInspect?: (link: string) => void;
}) {
  const { entries, unseenError } = useLog();
  const [filter, setFilter] = useState<LogFilter>('All');
  const [selectedId, setSelectedId] = useState(focusEntryId);
  const [openedOn, setOpenedOn] = useState(focusEntryId);
  const selected = entries.find((e) => e.id === selectedId);
  const select = useCallback((entry: LogEntry) => setSelectedId(entry.id), []);

  useEffect(() => {
    if (!visible) return;
    setSelectedId(focusEntryId);
    setOpenedOn(focusEntryId);
  }, [visible, focusEntryId]);

  useEffect(() => {
    if (visible && unseenError) appLog.markSeen();
  }, [visible, unseenError]);

  const showList = () => {
    setSelectedId(undefined);
    setOpenedOn(undefined);
  };
  const back = () => {
    if (selected && selectedId !== openedOn) showList();
    else onClose();
  };

  return (
    <Sheet visible={visible} onClose={back}>
      {selected ? (
        <LogDetail entry={selected} onBack={showList} onInspect={onInspect} />
      ) : (
        <LogList
          entries={entries}
          filter={filter}
          onFilter={setFilter}
          onSelect={select}
        />
      )}
    </Sheet>
  );
}

function LogList({
  entries,
  filter,
  onFilter,
  onSelect,
}: {
  entries: LogEntry[];
  filter: LogFilter;
  onFilter: (filter: LogFilter) => void;
  onSelect: (entry: LogEntry) => void;
}) {
  const { colors } = useTheme();
  const errors = entries.filter((e) => e.state === 'error').length;
  const shown = entries.filter((e) => matchesFilter(filter, e));
  const share = () => {
    Share.share({ message: exportLog(entries, deviceInfo()) });
  };
  return (
    <>
      <View style={styles.row}>
        <Text style={[type.heading, styles.grow, { color: colors.text }]}>
          Logs
        </Text>
        <TextAction title="Share" onPress={share} />
        <TextAction
          title="Clear"
          onPress={() => appLog.clear()}
          color={colors.textMuted}
        />
      </View>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {LOG_FILTERS.map((f) => {
            const countErrors = f === 'Errors' && errors > 0;
            return (
              <Chip
                key={f}
                text={countErrors ? `${f} ${errors}` : f}
                onPress={() => onFilter(f)}
                selected={f === filter}
                color={countErrors && f !== filter ? colors.error : undefined}
              />
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={shown}
        keyExtractor={(entry) => String(entry.id)}
        style={styles.grow}
        ListEmptyComponent={
          <Text
            style={[type.caption, styles.empty, { color: colors.textMuted }]}
          >
            Nothing logged yet
          </Text>
        }
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => <LogRow entry={item} onSelect={onSelect} />}
      />
    </>
  );
}

function Separator() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
}

const LogRow = memo(function LogRow({
  entry,
  onSelect,
}: {
  entry: LogEntry;
  onSelect: (entry: LogEntry) => void;
}) {
  const { colors } = useTheme();
  const action = entry.action;
  return (
    <Pressable
      onPress={() => onSelect(entry)}
      style={({ pressed }) => [
        styles.row,
        styles.logRow,
        pressed && { backgroundColor: colors.surface },
      ]}
    >
      <StatusDot state={entry.state} />
      <Text
        style={[type.monoSmall, styles.typeLabel, { color: colors.textMuted }]}
      >
        {entry.type}
      </Text>
      <View style={styles.grow}>
        <Text
          numberOfLines={1}
          style={[type.bodyStrong, { color: colors.text }]}
        >
          {entry.title}
        </Text>
        {entry.detail ? (
          <Text
            numberOfLines={1}
            style={[type.caption, { color: colors.textMuted }]}
          >
            {entry.detail}
          </Text>
        ) : null}
      </View>
      <Text style={[type.caption, { color: colors.textFaint }]}>
        {formatClock(entry.time)}
      </Text>
      {isRepeatable(action) ? (
        <Pressable
          onPress={() => rerun(action)}
          accessibilityRole="button"
          accessibilityLabel="Run again"
          style={styles.iconButton}
        >
          <Text style={[styles.rerun, { color: colors.accent }]}>↻</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
});

function LogDetail({
  entry,
  onBack,
  onInspect,
}: {
  entry: LogEntry;
  onBack: () => void;
  onInspect?: (link: string) => void;
}) {
  const { colors } = useTheme();
  const { action, link } = entry;
  return (
    <>
      <View style={[styles.row, styles.detailHeader]}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.iconButton}
        >
          <StrokeIcon path={ICON_PATHS.back} color={colors.textMuted} />
        </Pressable>
        <StatusDot state={entry.state} />
        <Text
          numberOfLines={1}
          style={[type.heading, styles.grow, { color: colors.text }]}
        >
          {entry.title}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {formatClock(entry.time, true)}
        </Text>
      </View>
      <ScrollView
        style={[styles.grow, styles.code, { backgroundColor: colors.surface }]}
        contentContainerStyle={styles.codeContent}
      >
        <Text selectable style={[type.mono, { color: colors.text }]}>
          {codeOf(entry)}
        </Text>
      </ScrollView>
      <View style={[styles.row, styles.actions]}>
        <AppButton
          title="Copy"
          style="outline"
          onPress={() => copyToClipboard(codeOf(entry))}
          containerStyle={styles.grow}
        />
        {isRepeatable(action) ? (
          <AppButton
            title="Run again"
            style="outline"
            onPress={() => rerun(action)}
            containerStyle={styles.grow}
          />
        ) : null}
        {link && onInspect ? (
          <AppButton
            title="Inspect link"
            style="outline"
            onPress={() => onInspect(link)}
            containerStyle={styles.grow}
          />
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  filters: { gap: 8, paddingBottom: 6 },
  empty: { paddingVertical: 24 },
  divider: { height: 1 },
  logRow: { minHeight: MIN_TOUCH, paddingVertical: 10 },
  typeLabel: { width: 56 },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerun: { fontSize: 20 },
  detailHeader: { paddingBottom: 10 },
  code: { borderRadius: 10 },
  codeContent: { padding: 12 },
  actions: { paddingTop: 12 },
});
