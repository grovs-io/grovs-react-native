import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { purchaseFullLabel } from '../../data/forms';
import type { KeyValueRow } from '../../data/keyValue';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import {
  Chevron,
  FoldRow,
  ScreenTitle,
  SectionHeader,
} from '../controls/Basics';
import { AppButton, MIN_TOUCH } from '../controls/Buttons';
import { ChipInput, ChipRow } from '../controls/Chips';
import { AppTextField } from '../controls/Fields';
import { KeyValueRows } from '../controls/KeyValueRows';
import { Sheet } from '../controls/Sheet';
import { help } from '../help';
import { Screen } from '../Screen';
import { EventFormFields, PurchaseFormFields } from './EventForms';
import { useEvents } from './useEvents';

type Events = ReturnType<typeof useEvents>;

const SCREEN_NAMES = ['Home', 'Links', 'Events', 'In-app', 'Excluded'];
const IOS = Platform.OS === 'ios';

export function EventsScreen() {
  const events = useEvents();
  return (
    <Screen>
      <ScreenTitle title="Events" />

      <SectionHeader title="Custom event" info={help.customEvent} />
      <EventFormFields
        form={events.event}
        update={events.updateEvent}
        error={events.eventError}
        reserved={events.reserved}
        onTrack={() => events.trackEvent()}
        onSendAnyway={() => events.trackEvent(true)}
      />
      <AppButton
        title={events.eventError ?? 'Track'}
        onPress={() => events.trackEvent()}
        disabled={events.eventError !== null}
        containerStyle={styles.topGap}
      />

      <SectionHeader title="Screen view" info={help.screenView} />
      <ScreenView events={events} />

      <SectionHeader title="Setup" />
      <FoldRow
        title="Global tags"
        summary={events.globalTags.join(', ') || 'none'}
        info={help.globalTags}
      >
        <ChipInput
          values={events.globalTags}
          onChange={events.applyGlobalTags}
          placeholder="Add tag"
          fieldTestID="globalTagsField"
        />
      </FoldRow>
      <FoldRow
        title="Screen aliases"
        summary={
          events.aliases
            .filter((row) => row.key.trim() !== '')
            .map((row) => `${row.key.trim()} → ${row.value}`)
            .join(', ') || 'none'
        }
        info={help.screenAliases}
      >
        <AliasEditor
          key={JSON.stringify(events.aliases)}
          aliases={events.aliases}
          onApply={events.applyAliases}
        />
      </FoldRow>

      <SectionHeader title="Purchase" info={help.purchase} />
      <Purchase events={events} />
    </Screen>
  );
}

function ScreenView({ events }: { events: Events }) {
  const { colors } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { screen, updateScreen } = events;
  const blank = screen.name.trim() === '';
  return (
    <>
      <View style={styles.row}>
        <AppTextField
          value={screen.name}
          onChange={(name) => updateScreen({ name })}
          placeholder="Screen name"
          onSubmit={events.trackScreen}
          style={styles.grow}
        />
        <AppButton
          title="Track"
          small
          onPress={events.trackScreen}
          disabled={blank}
          onLongPress={() => setSheetOpen(true)}
        />
      </View>
      <View style={styles.chips}>
        <ChipRow
          values={SCREEN_NAMES}
          selected={screen.name}
          onPick={(name) => updateScreen({ name })}
        />
      </View>
      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        heightRatio={null}
      >
        <Text style={[type.heading, styles.sheetTitle, { color: colors.text }]}>
          Screen properties
        </Text>
        <KeyValueRows
          rows={screen.properties}
          onChange={(properties) => updateScreen({ properties })}
        />
        <AppButton
          title={blank ? 'Enter a screen name' : `Track ${screen.name.trim()}`}
          disabled={blank}
          onPress={() => {
            events.trackScreen();
            setSheetOpen(false);
          }}
          containerStyle={styles.topGap}
        />
      </Sheet>
    </>
  );
}

function AliasEditor({
  aliases,
  onApply,
}: {
  aliases: KeyValueRow[];
  onApply: (rows: KeyValueRow[]) => void;
}) {
  const [draft, setDraft] = useState(aliases);
  return (
    <>
      <KeyValueRows rows={draft} onChange={setDraft} textOnly />
      <AppButton
        title="Apply aliases"
        style="outline"
        onPress={() => onApply(draft)}
        containerStyle={styles.topGap}
      />
    </>
  );
}

function Purchase({ events }: { events: Events }) {
  const [expanded, setExpanded] = useState(false);
  const { purchase } = events;
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };
  const storeInput = purchase.originalJson;
  return (
    <>
      <View style={styles.row}>
        <AppButton
          title={purchaseFullLabel(purchase)}
          style={expanded ? 'primary' : 'outline'}
          onPress={events.logPurchase}
          disabled={!events.purchaseValid}
          containerStyle={styles.grow}
        />
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel="Edit purchase"
          accessibilityState={{ expanded }}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.pressed,
          ]}
        >
          <Chevron direction={expanded ? 'up' : 'down'} />
        </Pressable>
      </View>
      {expanded ? (
        <View style={styles.purchaseForm}>
          <PurchaseFormFields form={purchase} update={events.updatePurchase} />
          <FoldRow
            title={IOS ? 'App Store transaction' : 'Google Play purchase JSON'}
            summary={
              storeInput.trim() === '' ? 'empty' : IOS ? storeInput : 'pasted'
            }
            info={help.playPurchase}
          >
            <AppTextField
              value={storeInput}
              onChange={(originalJson) =>
                events.updatePurchase({ originalJson })
              }
              placeholder={IOS ? 'Transaction id' : 'purchase.originalJson'}
              mono
              multiline={!IOS}
              keyboard={IOS ? 'number' : 'text'}
              textStyle={IOS ? undefined : styles.jsonField}
              testID="storePurchaseField"
            />
            <AppButton
              title={IOS ? 'Log App Store purchase' : 'Log Play purchase'}
              style="outline"
              onPress={events.logStorePurchase}
              disabled={storeInput.trim() === ''}
              containerStyle={styles.topGap}
            />
          </FoldRow>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grow: { flex: 1 },
  topGap: { marginTop: 8 },
  chips: { marginTop: 6 },
  sheetTitle: { marginBottom: 8 },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  purchaseForm: { marginTop: 10 },
  jsonField: { minHeight: 120, textAlignVertical: 'top' },
});
