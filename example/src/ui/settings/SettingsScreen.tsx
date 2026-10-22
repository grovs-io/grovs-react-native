import { ScreenTitle } from '../controls/Basics';
import { useNav } from '../nav';
import { Screen } from '../Screen';

export function SettingsScreen() {
  const { closeSettings } = useNav();
  return (
    <Screen>
      <ScreenTitle title="Settings" action="Done" onAction={closeSettings} />
    </Screen>
  );
}
