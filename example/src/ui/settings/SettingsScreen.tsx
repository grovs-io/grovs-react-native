import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LogLevel } from 'react-native-grovs-wrapper';
import { middleEllipsis } from '../../data/strings';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import {
  copyToClipboard,
  FieldLabel,
  FoldRow,
  HelpText,
  readClipboard,
  ScreenTitle,
  SectionHeader,
  Segment,
  SettingRow,
  SwitchRow,
} from '../controls/Basics';
import { AppButton, TextAction } from '../controls/Buttons';
import { Chip, ChipInput } from '../controls/Chips';
import { AppTextField, LinkField } from '../controls/Fields';
import type { Info } from '../controls/Info';
import { inlineAction } from '../controls/TextField';
import { help } from '../help';
import { useNav } from '../nav';
import { Screen } from '../Screen';
import { useSettings } from './useSettings';

type Settings = ReturnType<typeof useSettings>;

const ENVIRONMENTS = [false, true] as const;
const DEBUG_LEVELS: readonly LogLevel[] = ['info', 'error'];

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

export function SettingsScreen() {
  const { closeSettings } = useNav();
  const settings = useSettings();
  return (
    <Screen footer={<RestartBar settings={settings} />}>
      <ScreenTitle title="Settings" action="Done" onAction={closeSettings} />
      <ProjectSection settings={settings} />
      <DeveloperSection settings={settings} />
    </Screen>
  );
}

function ProjectSection({ settings }: { settings: Settings }) {
  const { colors } = useTheme();
  const { profile, profiles, errors, update } = settings;
  const confirmDelete = () =>
    Alert.alert('Delete this profile?', profile.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: settings.deleteActive },
    ]);
  return (
    <>
      <SectionHeader title="Project" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chips}
      >
        {profiles.map((p) => (
          <Chip
            key={p.id}
            text={p.name}
            onPress={() => settings.select(p.id)}
            selected={p.id === profile.id}
          />
        ))}
        <Chip text="+ New" onPress={settings.addProfile} dashed />
      </ScrollView>
      <EditableRow
        key={`name-${profile.id}`}
        label="Name"
        value={profile.name}
        onChange={(name) => update({ name })}
        error={errors.name}
      />
      <EditableRow
        key={`key-${profile.id}`}
        label="API key"
        value={profile.apiKey}
        onChange={(apiKey) => update({ apiKey: apiKey.trim() })}
        error={errors.apiKey}
        info={help.apiKey}
        mono
      />
      <SettingRow label="Environment" info={help.environment}>
        <Segment
          options={ENVIRONMENTS}
          value={profile.test}
          onChange={(test) => update({ test })}
          label={(test) => (test ? 'Test' : 'Prod')}
          compact
          style={styles.segment}
        />
      </SettingRow>
      <View style={styles.field}>
        <LinkField
          label="Base URL"
          info={help.baseUrl}
          value={profile.baseUrl ?? ''}
          onChange={(baseUrl) => update({ baseUrl: baseUrl.trim() })}
          placeholder="SDK default"
        />
      </View>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      <FoldRow
        title="Clipboard domains"
        summary={profile.clipboardDomains.join(', ') || 'none'}
        info={help.clipboardDomains}
        asSheet
      >
        <ChipInput
          values={profile.clipboardDomains}
          onChange={(clipboardDomains) => update({ clipboardDomains })}
          placeholder="links.example.com"
          fieldTestID="domainsField"
        />
      </FoldRow>
      <SwitchRow
        label="Auto track screens"
        value={profile.autoTrack}
        onChange={(autoTrack) => update({ autoTrack })}
        info={help.autoTrackScreens}
      />
      <SwitchRow
        label="Start with SDK enabled"
        value={profile.startEnabled}
        onChange={(startEnabled) => update({ startEnabled })}
        info={help.startEnabled}
      />
      {profiles.length > 1 ? (
        <View style={styles.delete}>
          <TextAction
            title="Delete this profile"
            onPress={confirmDelete}
            color={colors.textMuted}
          />
        </View>
      ) : null}
    </>
  );
}

/** Shows the value; Edit opens a field that changes it as you type. */
function EditableRow({
  label,
  value,
  onChange,
  error,
  info,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  error: string | null;
  info?: Info;
  mono?: boolean;
}) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState(false);
  if (editing || error) {
    const paste = async () => {
      const text = await readClipboard();
      if (text) onChange(text);
    };
    return (
      <View style={styles.field}>
        <FieldLabel
          text={label}
          info={info}
          action={error ? undefined : 'Done'}
          onAction={() => setEditing(false)}
        />
        <AppTextField
          value={value}
          onChange={onChange}
          mono={mono}
          error={!!error}
          onSubmit={() => !error && setEditing(false)}
          accessibilityLabel={label}
          trailing={
            <TextAction title="Paste" onPress={paste} style={inlineAction} />
          }
        />
        {error ? <HelpText text={error} isError /> : null}
      </View>
    );
  }
  return (
    <SettingRow
      label={label}
      info={info}
      onPress={mono ? () => copyToClipboard(value) : () => setEditing(true)}
    >
      <Text
        numberOfLines={1}
        style={[
          mono ? type.mono : type.body,
          styles.value,
          { color: colors.textMuted },
        ]}
      >
        {mono ? middleEllipsis(value, 8) : value}
      </Text>
      <TextAction
        title="Edit"
        onPress={() => setEditing(true)}
        accessibilityLabel={`Edit ${label}`}
      />
    </SettingRow>
  );
}

function DeveloperSection({ settings }: { settings: Settings }) {
  return (
    <>
      <SectionHeader title="Developer" />
      <SettingRow
        label="Debug level"
        info={help.debugLevel}
        showDivider={false}
      >
        <Segment
          options={DEBUG_LEVELS}
          value={settings.debugLevel}
          onChange={settings.setDebugLevel}
          label={capitalize}
          compact
          style={styles.segment}
        />
      </SettingRow>
    </>
  );
}

function RestartBar({ settings }: { settings: Settings }) {
  const { colors } = useTheme();
  const { restart, restartNotice } = settings;
  if (restart === null) return null;
  const detail =
    restartNotice ?? restart.blockedBy ?? restart.changes.join(', ');
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.bar, { backgroundColor: colors.text }]}
    >
      <View style={styles.grow}>
        <Text style={[type.heading, { color: colors.background }]}>
          Restart to apply
        </Text>
        <Text style={[type.caption, { color: colors.textFaint }]}>
          {detail}
        </Text>
      </View>
      <AppButton
        title="Restart"
        onPress={settings.restartNow}
        disabled={restart.blockedBy !== null || restartNotice !== null}
        small
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingBottom: 8 },
  field: { paddingVertical: 8 },
  divider: { height: 1 },
  segment: { width: 140 },
  value: { flexShrink: 1 },
  delete: { alignItems: 'flex-start', marginTop: 6 },
  grow: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
