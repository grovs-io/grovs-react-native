import { ScreenTitle } from '../controls/Basics';
import { useNav } from '../nav';
import { Screen } from '../Screen';

export function HomeScreen() {
  const { openSettings } = useNav();
  return (
    <Screen>
      <ScreenTitle title="Home" action="Settings" onAction={openSettings} />
    </Screen>
  );
}
