import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Grovs from 'react-native-grovs-wrapper';
import { settingsStore } from '../../store/settingsStore';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { ScreenTitle, SectionHeader, StatusDot } from '../controls/Basics';
import { AppButton } from '../controls/Buttons';
import { useNav } from '../nav';
import { Screen } from '../Screen';
import { fireSavedTrigger, isExcluded } from './useInApp';

const SCREEN_NAME = 'Excluded';
const PREVIOUS_SCREEN = 'Home';

/** A plain page for checking that in-app messages wait while this screen is open. */
export function ExcludedScreen() {
  const { colors } = useTheme();
  const { closeExcluded } = useNav();
  const excluded = isExcluded(settingsStore.excludedScreens, SCREEN_NAME);

  useEffect(() => {
    Grovs.trackScreenView(SCREEN_NAME);
    return () => Grovs.trackScreenView(PREVIOUS_SCREEN);
  }, []);

  return (
    <Screen>
      <ScreenTitle
        title="Excluded screen"
        action="Close"
        onAction={closeExcluded}
      />
      <Text style={[type.body, { color: colors.textMuted }]}>
        While this screen is in the excluded list, in-app messages wait instead
        of showing here. Trigger one below, then close: it should show on the
        previous screen.
      </Text>

      <SectionHeader title="Status" />
      <View style={styles.status}>
        <StatusDot state={excluded ? 'ok' : 'warning'} />
        <Text style={[type.body, { color: colors.text }]}>
          {excluded
            ? 'In-app messages are blocked here'
            : `Not excluded: add ${SCREEN_NAME} to the list`}
        </Text>
      </View>

      <SectionHeader title="Test" />
      <AppButton
        title={`Trigger ${settingsStore.inAppTrigger}`}
        onPress={fireSavedTrigger}
        disabled={settingsStore.inAppTrigger.trim() === ''}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
