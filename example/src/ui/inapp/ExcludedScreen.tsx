import { ScreenTitle } from '../controls/Basics';
import { useNav } from '../nav';
import { Screen } from '../Screen';

export function ExcludedScreen() {
  const { closeExcluded } = useNav();
  return (
    <Screen>
      <ScreenTitle
        title="Excluded screen"
        action="Close"
        onAction={closeExcluded}
      />
    </Screen>
  );
}
