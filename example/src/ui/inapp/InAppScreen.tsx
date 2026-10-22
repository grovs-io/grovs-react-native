import { StyleSheet, View } from 'react-native';
import {
  HelpText,
  ScreenTitle,
  SectionHeader,
  Segment,
  SettingRow,
  SwitchRow,
} from '../controls/Basics';
import { AppButton } from '../controls/Buttons';
import { ChipInput, ChipRow } from '../controls/Chips';
import { AppTextField } from '../controls/Fields';
import { EVENT_NAMES } from '../events/EventForms';
import { help } from '../help';
import { useNav } from '../nav';
import { Screen } from '../Screen';
import { useInApp } from './useInApp';

export function InAppScreen() {
  const { openExcluded } = useNav();
  const inApp = useInApp();
  const blank = inApp.trigger.trim() === '';
  return (
    <Screen>
      <ScreenTitle title="In-app" />
      <Segment
        options={[false, true]}
        value={inApp.running}
        onChange={inApp.setRunning}
        label={(running) => (running ? 'Running' : 'Paused')}
      />

      <SectionHeader title="Show a message" info={help.showMessage} />
      <View style={styles.row}>
        <View style={styles.grow}>
          <AppTextField
            value={inApp.trigger}
            onChange={inApp.setTrigger}
            placeholder="Event name"
            mono
            onSubmit={inApp.fireTrigger}
          />
        </View>
        <AppButton
          title="Trigger"
          small
          onPress={inApp.fireTrigger}
          disabled={blank}
        />
      </View>
      <HelpText text="Fires this event. Set a campaign with this trigger in the dashboard." />
      <View style={styles.chips}>
        <ChipRow
          values={EVENT_NAMES}
          selected={inApp.trigger}
          onPick={inApp.setTrigger}
        />
      </View>

      <SectionHeader title="Queue" info={help.queue} />
      <View style={styles.row}>
        <AppButton
          title="Discard waiting"
          style="outline"
          small
          onPress={() => inApp.discard(false)}
          containerStyle={styles.grow}
        />
        <AppButton
          title="Close current"
          style="outline"
          small
          onPress={() => inApp.discard(true)}
          containerStyle={styles.grow}
        />
      </View>

      <SectionHeader title="Rules" />
      <SwitchRow
        label="Debug logging"
        value={inApp.debug}
        onChange={inApp.setDebug}
        info={help.inAppDebug}
      />
      <View style={styles.excluded}>
        <ChipInput
          values={inApp.excluded}
          onChange={inApp.setExcluded}
          label="Excluded screens"
          info={help.excludedScreens}
          placeholder="Add screen"
          fieldTestID="excludedField"
        />
      </View>
      <SettingRow
        label="Open an excluded screen"
        onPress={openExcluded}
        showDivider={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grow: { flex: 1 },
  excluded: { marginTop: 10 },
  chips: { marginTop: 6 },
});
