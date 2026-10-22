import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import Grovs from 'react-native-grovs-wrapper';
import { DEFAULT_PROFILES } from '../../../data/profile';
import { SettingsScreen } from '../SettingsScreen';

const mockValues: Record<string, string> = {};

jest.mock('../../../store/exampleStore', () => ({
  NativeKeys: jest.requireActual('../../../store/exampleStore').NativeKeys,
  exampleStore: {
    get: (key: string) => mockValues[key],
    set: (key: string, value: string | null) => {
      if (value === null) delete mockValues[key];
      else mockValues[key] = value;
    },
    get startedProfile() {
      return jest.requireActual('../../../data/profile').DEFAULT_PROFILES[0];
    },
    restart: jest.fn(),
  },
}));

jest.mock('react-native-grovs-wrapper', () => ({
  __esModule: true,
  default: { setDebug: jest.fn() },
}));

beforeEach(() => {
  Object.keys(mockValues).forEach((key) => delete mockValues[key]);
  jest.clearAllMocks();
});

const press = (text: string) => fireEvent.press(screen.getByText(text));

describe('SettingsScreen', () => {
  it('shows the restart bar only while a project setting differs', () => {
    render(<SettingsScreen />);
    expect(screen.queryByText('Restart to apply')).toBeNull();
    press('Prod');
    expect(screen.getByText('Restart to apply')).toBeTruthy();
    expect(screen.getAllByText('Environment')).toHaveLength(2);
    press('Test');
    expect(screen.queryByText('Restart to apply')).toBeNull();
  });

  it('a blank API key shows its error and blocks Restart', () => {
    render(<SettingsScreen />);
    fireEvent.press(screen.getByLabelText('Edit API key'));
    fireEvent.changeText(screen.getByLabelText('API key'), '');
    expect(screen.getAllByText('Enter an API key')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Restart' }).props.accessibilityState
    ).toMatchObject({ disabled: true });
  });

  it('+ New adds a selected copy and the bar names the project', () => {
    render(<SettingsScreen />);
    press('+ New');
    const copy = `${DEFAULT_PROFILES[0]!.name} copy`;
    expect(screen.getAllByText(copy)).toHaveLength(2);
    expect(screen.getAllByText('Project')).toHaveLength(2);
    expect(screen.getByText('Delete this profile')).toBeTruthy();
  });

  it('asks before deleting a profile and deletes on confirm', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<SettingsScreen />);
    press('+ New');
    const copy = `${DEFAULT_PROFILES[0]!.name} copy`;
    press('Delete this profile');
    expect(screen.getAllByText(copy)).toHaveLength(2);
    const buttons = alert.mock.calls[0]![2]!;
    expect(buttons.map((b) => b.text)).toEqual(['Cancel', 'Delete']);
    act(() => buttons[1]!.onPress!());
    expect(screen.queryByText(copy)).toBeNull();
    expect(screen.queryByText('Delete this profile')).toBeNull();
  });

  it('keeps the profile when the delete is cancelled', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    render(<SettingsScreen />);
    press('+ New');
    press('Delete this profile');
    expect(alert.mock.calls[0]![2]![0]!.onPress).toBeUndefined();
    expect(screen.getByText('Delete this profile')).toBeTruthy();
  });

  it('applies the debug level right away', async () => {
    render(<SettingsScreen />);
    await act(async () => press('Error'));
    expect(Grovs.setDebug).toHaveBeenCalledWith('error');
  });
});
