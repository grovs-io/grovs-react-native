import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import {
  CopyRow,
  SectionHeader,
  SettingRow,
  StatusPill,
  SwitchRow,
} from '../controls/Basics';
import { AppButton, MIN_TOUCH, TextAction } from '../controls/Buttons';
import { Chip } from '../controls/Chips';
import { SuggestField } from '../controls/Fields';
import { KeyValueRows } from '../controls/KeyValueRows';
import { help } from '../help';
import { useNav } from '../nav';
import { Screen } from '../Screen';
import { ICON_PATHS, StrokeIcon } from '../TabIcons';
import { QuickActionSheet, type QuickAction } from './QuickActionSheet';
import {
  deviceName,
  randomId,
  startedProfile,
  useHome,
  useLatestLink,
  useNotifications,
  usePushToken,
} from './useHome';
import { version as sdkVersion } from '../../../../package.json';

type Home = ReturnType<typeof useHome>;

const QA_USER = 'qa_user_1';

export function HomeScreen() {
  const home = useHome();
  return (
    <Screen>
      <Header />
      <StatusSection home={home} />
      <OpenedFromSection />
      <IdentitySection home={home} />
      <QuickActions home={home} />
    </Screen>
  );
}

function Header() {
  const { colors } = useTheme();
  const { openSettings } = useNav();
  const environment = startedProfile()?.test === false ? 'Prod' : 'Test';
  return (
    <View style={[styles.row, styles.header]}>
      <View style={[styles.logo, { backgroundColor: colors.accent }]}>
        <Text style={[type.heading, { color: colors.onAccent }]}>g</Text>
      </View>
      <Text style={[type.title, styles.grow, { color: colors.text }]}>
        Grovs Test
      </Text>
      <Text style={[type.caption, { color: colors.textMuted }]}>
        {environment} · {sdkVersion}
      </Text>
      <Pressable
        onPress={openSettings}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <StrokeIcon path={ICON_PATHS.gear} color={colors.textMuted} size={22} />
      </Pressable>
    </View>
  );
}

function StatusSection({ home }: { home: Home }) {
  const { colors } = useTheme();
  const { openSettings } = useNav();
  const [token, refreshToken] = usePushToken();
  const notifications = useNotifications(refreshToken);
  return (
    <>
      <SectionHeader title="Status" />
      <SwitchRow
        label="SDK enabled"
        value={home.sdkEnabled}
        onChange={home.setSdkEnabled}
        info={help.sdkEnabled}
      />
      <SettingRow label="Project" onPress={openSettings}>
        <Text style={[type.body, { color: colors.textMuted }]}>
          {startedProfile()?.name ?? 'unknown'}
        </Text>
        <StrokeIcon
          path={ICON_PATHS.chevronRight}
          color={colors.textFaint}
          size={18}
        />
      </SettingRow>
      <SettingRow label="Notifications">
        {notifications.allowed === null ? (
          <TextAction title="Open settings" onPress={notifications.allow} />
        ) : notifications.allowed ? (
          <StatusPill text="Allowed" state="ok" />
        ) : (
          <>
            <StatusPill text="Not allowed" state="warning" />
            <TextAction title="Allow" onPress={notifications.allow} />
          </>
        )}
      </SettingRow>
      <CopyRow
        label="Push token"
        value={token}
        emptyText="Not available yet"
        info={help.pushToken}
      />
    </>
  );
}

function OpenedFromSection() {
  const { colors } = useTheme();
  const { openLogs } = useNav();
  const latest = useLatestLink();
  return (
    <>
      <SectionHeader
        title="Opened from"
        info={help.openedFrom}
        trailing={latest?.ago}
      />
      {latest ? (
        <SettingRow
          label={latest.entry.link ?? ''}
          labelStyle={[type.mono, { color: colors.text }]}
          onPress={() => openLogs(latest.entry.id)}
        >
          <StatusPill text="received" state="ok" />
        </SettingRow>
      ) : (
        <Text style={[type.caption, styles.empty, { color: colors.textMuted }]}>
          Not opened from a link yet
        </Text>
      )}
    </>
  );
}

function IdentitySection({ home }: { home: Home }) {
  const { colors } = useTheme();
  const { identity, draft, setDraft } = home;
  const header = (
    <SectionHeader
      title="Identity"
      info={help.identity}
      action={home.editing ? undefined : 'Change'}
      onAction={home.startEditing}
    />
  );
  if (!home.editing) {
    return (
      <>
        {header}
        <SettingRow label="Identifier" onPress={home.startEditing}>
          <Text
            numberOfLines={1}
            style={[type.body, styles.value, { color: colors.textMuted }]}
          >
            {identity.identifier || 'None'}
          </Text>
        </SettingRow>
        <SettingRow label="Attributes" onPress={home.startEditing}>
          <Text
            numberOfLines={1}
            style={[type.caption, styles.value, { color: colors.textMuted }]}
          >
            {home.attributesSummary || 'none'}
          </Text>
        </SettingRow>
      </>
    );
  }
  const device = deviceName();
  const pick = (identifier: string) => setDraft({ ...draft, identifier });
  return (
    <>
      {header}
      <View style={styles.editor}>
        <View>
          <SuggestField
            label="Identifier"
            value={draft.identifier}
            onChange={pick}
            suggestions={[]}
            placeholder="None"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chips}
          >
            <Chip
              text="Device name"
              onPress={() => pick(device)}
              selected={draft.identifier === device}
            />
            <Chip text="Random id" onPress={() => pick(randomId())} />
            <Chip
              text={QA_USER}
              onPress={() => pick(QA_USER)}
              selected={draft.identifier === QA_USER}
            />
            <Chip
              text="None"
              onPress={() => pick('')}
              selected={draft.identifier === ''}
              dashed={draft.identifier !== ''}
            />
          </ScrollView>
        </View>
        <KeyValueRows
          label="Attributes"
          rows={draft.attributes}
          onChange={(attributes) => setDraft({ ...draft, attributes })}
          suggestedKeys={['plan', 'country']}
        />
        <View style={[styles.row, styles.pair]}>
          <AppButton
            title="Cancel"
            style="outline"
            onPress={home.cancelEditing}
            containerStyle={styles.grow}
          />
          <AppButton
            title="Save"
            onPress={home.saveIdentity}
            containerStyle={styles.grow}
          />
        </View>
      </View>
    </>
  );
}

function QuickActions({ home }: { home: Home }) {
  const [sheet, setSheet] = useState<{
    action: QuickAction;
    visible: boolean;
    openCount: number;
  }>({ action: 'link', visible: false, openCount: 0 });
  const edit = (action: QuickAction) =>
    setSheet((s) => ({ action, visible: true, openCount: s.openCount + 1 }));
  const { labels } = home;
  return (
    <>
      <SectionHeader
        title="Quick actions"
        trailing="hold to edit"
        info={help.quickActions}
      />
      <View style={styles.grid}>
        <View style={[styles.row, styles.pair]}>
          <AppButton
            title={labels.generate}
            onPress={() => home.generate()}
            disabled={home.generating}
            onLongPress={() => edit('link')}
            containerStyle={styles.grow}
          />
          <AppButton
            title={labels.clipboard}
            style="outline"
            onPress={() => {
              home.openClipboard();
            }}
            containerStyle={styles.grow}
          />
        </View>
        <View style={[styles.row, styles.pair]}>
          <AppButton
            title={labels.track}
            style="outline"
            onPress={() => home.track()}
            disabled={home.trackError !== null}
            onLongPress={() => edit('track')}
            containerStyle={styles.grow}
          />
          <AppButton
            title={labels.purchase}
            style="outline"
            onPress={() => home.purchase()}
            disabled={!home.purchaseValid}
            onLongPress={() => edit('purchase')}
            containerStyle={styles.grow}
          />
        </View>
      </View>
      <QuickActionSheet
        {...sheet}
        home={home}
        onClose={() => setSheet((s) => ({ ...s, visible: false }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  header: { gap: 8, paddingTop: 10, paddingBottom: 4 },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  pressed: { opacity: 0.6 },
  empty: { paddingVertical: 8 },
  value: { flexShrink: 1, maxWidth: '60%' },
  editor: { gap: 12, paddingTop: 4 },
  chips: { gap: 6, paddingTop: 6 },
  pair: { gap: 8 },
  grid: { gap: 8, paddingTop: 4 },
});
