import { useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import type { LogState } from '../../actions/log';
import type { TriState as TriStateValue } from '../../data/forms';
import { middleEllipsis } from '../../data/strings';
import type { AppColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { MIN_TOUCH, TextAction } from './Buttons';
import { InfoButton, type Info } from './Info';
import { Sheet } from './Sheet';
import { showToast } from './Toast';

type Action = { action?: string; onAction?: () => void };

export function ScreenTitle({
  title,
  action,
  onAction = () => {},
}: { title: string } & Action) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, styles.screenTitle]}>
      <Text style={[type.title, styles.grow, { color: colors.text }]}>
        {title}
      </Text>
      {action ? <TextAction title={action} onPress={onAction} /> : null}
    </View>
  );
}

function LabelWithInfo({
  text,
  style,
  info,
}: {
  text: string;
  style: StyleProp<TextStyle>;
  info?: Info;
}) {
  return (
    <View style={[styles.row, styles.grow]}>
      <Text style={[style, styles.shrink]}>{text}</Text>
      {info ? <InfoButton info={info} /> : null}
    </View>
  );
}

export function SectionHeader({
  title,
  info,
  trailing,
  action,
  onAction = () => {},
}: { title: string; info?: Info; trailing?: string } & Action) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, styles.sectionHeader]}>
      <LabelWithInfo
        text={title}
        style={[type.label, { color: colors.textMuted }]}
        info={info}
      />
      {trailing ? (
        <Text style={[type.caption, { color: colors.textFaint }]}>
          {trailing}
        </Text>
      ) : null}
      {action ? <TextAction title={action} onPress={onAction} /> : null}
    </View>
  );
}

export function FieldLabel({
  text,
  info,
  trailing,
  action,
  onAction = () => {},
}: { text: string; info?: Info; trailing?: string } & Action) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, styles.fieldLabel]}>
      <LabelWithInfo
        text={text}
        style={[type.label, { color: colors.textMuted }]}
        info={info}
      />
      {trailing ? (
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {trailing}
        </Text>
      ) : null}
      {action ? <TextAction title={action} onPress={onAction} /> : null}
    </View>
  );
}

export function HelpText({
  text,
  isError = false,
}: {
  text: string;
  isError?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        type.caption,
        styles.help,
        { color: isError ? colors.error : colors.textMuted },
      ]}
    >
      {text}
    </Text>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
}

export function SettingRow({
  label,
  onPress,
  showDivider = true,
  info,
  labelStyle,
  children,
}: {
  label: string;
  onPress?: () => void;
  showDivider?: boolean;
  info?: Info;
  labelStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          styles.row,
          styles.settingRow,
          pressed && { backgroundColor: colors.surface },
        ]}
      >
        <LabelWithInfo
          text={label}
          style={labelStyle ?? [type.body, { color: colors.text }]}
          info={info}
        />
        {children}
      </Pressable>
      {showDivider ? <Divider /> : null}
    </View>
  );
}

export function SwitchRow({
  label,
  value,
  onChange,
  supporting,
  showDivider,
  info,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  supporting?: string;
  showDivider?: boolean;
  info?: Info;
}) {
  const { colors } = useTheme();
  return (
    <SettingRow
      label={label}
      onPress={() => onChange(!value)}
      showDivider={showDivider}
      info={info}
    >
      {supporting ? (
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {supporting}
        </Text>
      ) : null}
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: colors.neutralDot, true: colors.accent }}
        ios_backgroundColor={colors.neutralDot}
      />
    </SettingRow>
  );
}

export function Segment<T>({
  options,
  value,
  onChange,
  label = String,
  compact = false,
  style,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label?: (option: T) => string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.segment, { backgroundColor: colors.chipFill }, style]}
    >
      {options.map((option) => {
        const on = option === value;
        const text = label(option);
        return (
          <Pressable
            key={text}
            onPress={() => onChange(option)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            hitSlop={3}
            style={[
              styles.segmentItem,
              compact ? styles.segmentCompact : styles.segmentRegular,
              on && { backgroundColor: colors.background },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                type.label,
                { color: on ? colors.text : colors.textMuted },
              ]}
            >
              {text}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const TRI_STATES: readonly TriStateValue[] = ['default', 'on', 'off'];
const TRI_LABELS: Record<TriStateValue, string> = {
  default: 'Default',
  on: 'On',
  off: 'Off',
};

/** Default leaves the project's setting, On and Off override it. */
export function TriState({
  label,
  value,
  onChange,
  info,
}: {
  label: string;
  value: TriStateValue;
  onChange: (value: TriStateValue) => void;
  info?: Info;
}) {
  return (
    <SettingRow label={label} info={info}>
      <Segment
        options={TRI_STATES}
        value={value}
        onChange={onChange}
        label={(state) => TRI_LABELS[state]}
        compact
        style={styles.triState}
      />
    </SettingRow>
  );
}

export function stateColor(state: LogState, colors: AppColors): string {
  return {
    ok: colors.ok,
    warning: colors.warning,
    error: colors.error,
    neutral: colors.neutralDot,
  }[state];
}

function softStateColor(state: LogState, colors: AppColors): string {
  return {
    ok: colors.okSoft,
    warning: colors.warningSoft,
    error: colors.errorSoft,
    neutral: colors.chipFill,
  }[state];
}

export function StatusDot({
  state,
  testID,
}: {
  state: LogState;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[styles.dot, { backgroundColor: stateColor(state, colors) }]}
    />
  );
}

export function StatusPill({ text, state }: { text: string; state: LogState }) {
  const { colors } = useTheme();
  return (
    <Text
      numberOfLines={1}
      style={[
        type.label,
        styles.pill,
        {
          color:
            state === 'neutral' ? colors.textMuted : stateColor(state, colors),
          backgroundColor: softStateColor(state, colors),
        },
      ]}
    >
      {text}
    </Text>
  );
}

export function Chevron({ direction }: { direction: 'down' | 'up' | 'right' }) {
  const { colors } = useTheme();
  const rotate = { down: '45deg', up: '-135deg', right: '-45deg' }[direction];
  return (
    <View
      style={[
        styles.chevron,
        { borderColor: colors.textFaint, transform: [{ rotate }] },
      ]}
    />
  );
}

/** Rare options folded away, with a one-line summary of what they hold. */
export function FoldRow({
  title,
  summary,
  children,
  asSheet = false,
  initiallyExpanded = false,
  info,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
  asSheet?: boolean;
  initiallyExpanded?: boolean;
  info?: Info;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(initiallyExpanded && !asSheet);
  const toggle = () => {
    if (!asSheet) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setOpen(!open);
  };
  const inline = open && !asSheet;
  return (
    <View>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={[styles.row, styles.settingRow]}
      >
        <LabelWithInfo
          text={title}
          style={[type.bodyStrong, { color: colors.text }]}
          info={info}
        />
        {inline ? null : (
          <Text
            numberOfLines={1}
            style={[type.caption, styles.summary, { color: colors.textMuted }]}
          >
            {summary}
          </Text>
        )}
        <Chevron direction={asSheet ? 'right' : open ? 'up' : 'down'} />
      </Pressable>
      {inline ? <View style={styles.foldContent}>{children}</View> : null}
      {asSheet ? (
        <Sheet visible={open} onClose={() => setOpen(false)} heightRatio={null}>
          <Text
            style={[type.heading, styles.sheetTitle, { color: colors.text }]}
          >
            {title}
          </Text>
          {children}
        </Sheet>
      ) : null}
      <Divider />
    </View>
  );
}

export function copyToClipboard(text: string) {
  Clipboard.setString(text);
  showToast('Copied');
}

export function CopyRow({
  label,
  value,
  emptyText = 'Not set',
  info,
}: {
  label: string;
  value?: string | null;
  emptyText?: string;
  info?: Info;
}) {
  const { colors } = useTheme();
  const hasValue = value != null && value !== '';
  return (
    <SettingRow
      label={label}
      info={info}
      onPress={hasValue ? () => copyToClipboard(value) : undefined}
    >
      <Text style={[type.mono, { color: colors.textMuted }]}>
        {hasValue ? middleEllipsis(value) : emptyText}
      </Text>
      {hasValue ? (
        <Text style={[type.label, { color: colors.accent }]}>Copy</Text>
      ) : null}
    </SettingRow>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  shrink: { flexShrink: 1 },
  screenTitle: { paddingTop: 10, paddingBottom: 8 },
  sectionHeader: { paddingTop: 18, paddingBottom: 4 },
  fieldLabel: { paddingBottom: 4 },
  help: { paddingTop: 4 },
  divider: { height: 1 },
  settingRow: { minHeight: MIN_TOUCH, paddingVertical: 6, gap: 8 },
  segment: { flexDirection: 'row', borderRadius: 9, padding: 3, gap: 3 },
  segmentItem: {
    flex: 1,
    minHeight: MIN_TOUCH - 6,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentCompact: { paddingVertical: 8 },
  segmentRegular: { paddingVertical: 10 },
  triState: { width: 170 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  pill: {
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chevron: {
    width: 8,
    height: 8,
    marginHorizontal: 6,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
  },
  summary: { maxWidth: 180 },
  foldContent: { paddingBottom: 8 },
  sheetTitle: { marginBottom: 8 },
});
