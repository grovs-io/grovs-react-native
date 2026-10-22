import { ScreenTitle } from '../controls/Basics';
import { useNav } from '../nav';
import { Screen } from '../Screen';

export function InAppScreen() {
  const { openExcluded } = useNav();
  return (
    <Screen>
      <ScreenTitle
        title="In-app"
        action="Excluded screen"
        onAction={openExcluded}
      />
    </Screen>
  );
}
