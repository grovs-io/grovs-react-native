import { useState } from 'react';
import {
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { formatClock } from '../../data/strings';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import {
  copyToClipboard,
  ScreenTitle,
  SectionHeader,
  StatusDot,
} from '../controls/Basics';
import { AppButton, MIN_TOUCH, TextAction } from '../controls/Buttons';
import { LinkField } from '../controls/Fields';
import { showToast } from '../controls/Toast';
import { help } from '../help';
import { Screen } from '../Screen';
import { LinkFormFields } from './LinkFormFields';
import { COMMAND_LABEL, copyOpenCommand, QrSheet } from './QrSheet';
import { useLinks, type LinkResult } from './useLinks';

export function LinksScreen() {
  const { colors } = useTheme();
  const links = useLinks();
  const footer = (
    <View style={[styles.footer, { backgroundColor: colors.background }]}>
      <AppButton
        title={links.running ? 'Generating…' : 'Generate link'}
        onPress={links.generate}
        disabled={links.running || links.formError !== null}
        disabledReason={links.formError ?? undefined}
      />
    </View>
  );
  return (
    <Screen footer={footer}>
      <ScreenTitle title="Links" action="Reset" onAction={links.reset} />
      <LinkField
        label="Inspect a link"
        info={help.inspect}
        placeholder="Paste a link to inspect"
        value={links.inspectInput}
        onChange={links.setInspectInput}
        showPath
        onDone={links.inspect}
      />
      {links.result ? (
        <ResultCard
          result={links.result}
          onRunAgain={links.runAgain}
          onInspect={links.inspectGenerated}
        />
      ) : null}
      <SectionHeader title="New link" />
      <LinkFormFields
        key={links.formKey}
        form={links.form}
        update={links.update}
      />
    </Screen>
  );
}

function openLink(link: string) {
  Linking.openURL(link).catch(() => showToast('Could not open the link'));
}

function ResultCard({
  result,
  onRunAgain,
  onInspect,
}: {
  result: LinkResult;
  onRunAgain: () => void;
  onInspect: (link: string) => void;
}) {
  const { colors } = useTheme();
  const [qrVisible, setQrVisible] = useState(false);
  const state = result.ok ? 'ok' : 'error';
  const { link } = result;
  const when = `${formatClock(result.time, true)} · ${result.elapsedMs} ms`;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: result.ok ? colors.okSoft : colors.errorSoft,
          borderColor: result.ok ? colors.ok : colors.error,
        },
      ]}
    >
      <View style={styles.row}>
        <StatusDot state={state} />
        <Text style={[type.caption, styles.grow, { color: colors.textMuted }]}>
          {result.ok ? `Created · ${when}` : 'Failed'}
        </Text>
        <Pressable
          onPress={onRunAgain}
          accessibilityRole="button"
          accessibilityLabel="Run again"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.rerun, { color: colors.accent }]}>↻</Text>
        </Pressable>
      </View>
      {result.ok && link ? (
        <>
          <Text
            selectable
            style={[type.mono, styles.link, { color: colors.accent }]}
          >
            {link}
          </Text>
          <View style={styles.actions}>
            <TextAction title="Copy" onPress={() => copyToClipboard(link)} />
            <TextAction
              title="Share"
              onPress={() => {
                Share.share({ message: link }).catch(() =>
                  showToast('Could not share the link')
                );
              }}
            />
            <TextAction title="QR" onPress={() => setQrVisible(true)} />
            <TextAction title="Open" onPress={() => openLink(link)} />
            <TextAction
              title={COMMAND_LABEL}
              onPress={() => copyOpenCommand(link)}
            />
            <TextAction title="Inspect" onPress={() => onInspect(link)} />
          </View>
          <QrSheet
            link={link}
            visible={qrVisible}
            onClose={() => setQrVisible(false)}
          />
        </>
      ) : (
        <Text
          selectable
          style={[type.caption, styles.error, { color: colors.error }]}
        >
          {result.message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grow: { flex: 1 },
  card: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  pressed: { opacity: 0.6 },
  rerun: { fontSize: 20 },
  link: { paddingBottom: 2 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  error: { paddingBottom: 10 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
});
