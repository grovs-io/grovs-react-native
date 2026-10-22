import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { TestAction } from '../../../actions/log';
import { appLog } from '../../../actions/testLog';
import { lightColors } from '../../../theme/colors';
import { Scaffold } from '../../Scaffold';
import { LogsPanel } from '../LogsPanel';

const mockValues: Record<string, string> = {};
jest.mock('../../../store/exampleStore', () => ({
  exampleStore: {
    load: () => Promise.resolve(),
    get: (key: string) => mockValues[key],
    set: (key: string, value: string | null) => {
      if (value === null) delete mockValues[key];
      else mockValues[key] = value;
    },
    get startedProfile() {
      return { name: 'Grovs test' };
    },
  },
}));

const insets = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderApp() {
  return render(
    <SafeAreaProvider initialMetrics={insets}>
      <Scaffold />
    </SafeAreaProvider>
  );
}

const dotColor = (testID: string) =>
  StyleSheet.flatten(screen.getByTestId(testID).props.style).backgroundColor;

function action(overrides: Partial<TestAction> = {}): TestAction {
  return {
    type: 'EVENT',
    title: 'Track demo_tapped',
    code: 'Grovs.track("demo_tapped")',
    run: async () => ({ state: 'ok', detail: 'sent' }),
    ...overrides,
  };
}

beforeEach(() => {
  appLog.clear();
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
});

describe('console strip', () => {
  it('shows the newest entry title', async () => {
    appLog.add('SDK', 'ok', 'SDK configured', 'Grovs test · test');
    appLog.add('EVENT', 'ok', 'Track signup');
    renderApp();
    const strip = await screen.findByTestId('consoleStrip');
    expect(within(strip).getByText('Track signup')).toBeTruthy();
    expect(within(strip).queryByText('SDK configured')).toBeNull();
  });

  it('keeps the dot red after an error until the panel opens', async () => {
    appLog.add('EVENT', 'error', 'Track failed');
    appLog.add('EVENT', 'ok', 'Track signup');
    renderApp();
    await screen.findByTestId('consoleStrip');
    expect(dotColor('consoleStripDot')).toBe(lightColors.error);

    fireEvent.press(screen.getByTestId('consoleStrip'));
    expect(await screen.findByText('Logs')).toBeTruthy();
    expect(appLog.unseenError()).toBe(false);
    expect(dotColor('consoleStripDot')).toBe(lightColors.ok);
  });
});

describe('tabs', () => {
  it('switches tabs and saves the choice', async () => {
    renderApp();
    fireEvent.press(await screen.findByRole('tab', { name: 'Events' }));
    expect(screen.getByRole('tab', { name: 'Events' })).toBeSelected();
    expect(mockValues.tab).toBe('events');
  });

  it('opens on the saved tab', async () => {
    mockValues.tab = 'inapp';
    renderApp();
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'In-app' })).toBeSelected()
    );
  });
});

describe('LogsPanel', () => {
  it('filters errors and shows their count on the chip', () => {
    appLog.add('EVENT', 'ok', 'Track signup');
    appLog.add('CREATE', 'error', 'Generate link failed');
    appLog.add('SDK', 'error', 'SDK configure failed');
    render(<LogsPanel visible onClose={jest.fn()} />);

    fireEvent.press(screen.getByText('Errors 2'));
    expect(screen.getByText('Generate link failed')).toBeTruthy();
    expect(screen.getByText('SDK configure failed')).toBeTruthy();
    expect(screen.queryByText('Track signup')).toBeNull();
  });

  it('shows run again only for repeatable actions and reruns them', async () => {
    appLog.add('EVENT', 'ok', 'Track signup', 'sent', 'code', action());
    appLog.add(
      'SDK',
      'ok',
      'Set identifier',
      '',
      'code',
      action({ title: 'Set identifier', repeatable: false })
    );
    appLog.add('LINK', 'ok', 'Opened from link');
    render(<LogsPanel visible onClose={jest.fn()} />);

    const reruns = screen.getAllByLabelText('Run again');
    expect(reruns).toHaveLength(1);
    await act(async () => {
      fireEvent.press(reruns[0]!);
    });
    expect(appLog.entries()).toHaveLength(4);
    expect(appLog.entries()[0]?.title).toBe('Track demo_tapped');
  });

  it('shows the code of a tapped row', () => {
    appLog.add(
      'CREATE',
      'ok',
      'Generate link',
      'grovs.link/abc',
      'Grovs.generateLink({ title: "Test title" })'
    );
    render(<LogsPanel visible onClose={jest.fn()} />);
    fireEvent.press(screen.getByText('Generate link'));
    expect(
      screen.getByText('Grovs.generateLink({ title: "Test title" })')
    ).toBeTruthy();
    expect(screen.queryByText('Inspect link')).toBeNull();
  });

  it('opens on the focused entry and offers inspect for links', () => {
    const entry = appLog.recordLinkOpen('https://grovs.link/abc', {});
    const onInspect = jest.fn();
    render(
      <LogsPanel
        visible
        onClose={jest.fn()}
        focusEntryId={entry.id}
        onInspect={onInspect}
      />
    );
    fireEvent.press(screen.getByText('Inspect link'));
    expect(onInspect).toHaveBeenCalledWith('https://grovs.link/abc');
  });
});
