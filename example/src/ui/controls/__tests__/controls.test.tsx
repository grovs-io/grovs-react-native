import { useState } from 'react';
import { Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react-native';
import type { KeyValueRow } from '../../../data/keyValue';
import type { TriState as TriStateValue } from '../../../data/forms';
import { CopyRow, FoldRow, SwitchRow, TriState } from '../Basics';
import { AppButton } from '../Buttons';
import { ChipInput, ChipPicker } from '../Chips';
import { LinkField, MoneyField } from '../Fields';
import { InfoButton } from '../Info';
import { KeyValueRows } from '../KeyValueRows';
import { Sheet } from '../Sheet';
import { ToastHost } from '../Toast';

function Stateful<T>({
  initial,
  children,
  onValue,
}: {
  initial: T;
  onValue?: (value: T) => void;
  children: (value: T, set: (value: T) => void) => React.ReactElement;
}) {
  const [value, setValue] = useState(initial);
  return children(value, (next) => {
    setValue(next);
    onValue?.(next);
  });
}

describe('SwitchRow', () => {
  it('toggles when the label is pressed', () => {
    const onChange = jest.fn();
    render(
      <Stateful initial={false} onValue={onChange}>
        {(value, set) => (
          <SwitchRow label="SDK enabled" value={value} onChange={set} />
        )}
      </Stateful>
    );
    fireEvent.press(screen.getByText('SDK enabled'));
    expect(onChange).toHaveBeenLastCalledWith(true);
    fireEvent.press(screen.getByText('SDK enabled'));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});

describe('TriState', () => {
  it('goes from default to on to off', () => {
    const onChange = jest.fn();
    render(
      <Stateful<TriStateValue> initial="default" onValue={onChange}>
        {(value, set) => (
          <TriState label="Preview" value={value} onChange={set} />
        )}
      </Stateful>
    );
    expect(screen.getByRole('tab', { name: 'Default' })).toBeSelected();
    fireEvent.press(screen.getByText('On'));
    expect(onChange).toHaveBeenLastCalledWith('on');
    fireEvent.press(screen.getByText('Off'));
    expect(onChange).toHaveBeenLastCalledWith('off');
    expect(screen.getByRole('tab', { name: 'Off' })).toBeSelected();
  });
});

describe('ChipInput', () => {
  it('adds on comma and removes on ×', () => {
    const onChange = jest.fn();
    render(
      <Stateful<string[]> initial={[]} onValue={onChange}>
        {(values, set) => (
          <ChipInput label="Tags" values={values} onChange={set} />
        )}
      </Stateful>
    );
    const field = screen.getByTestId('chipInputField');
    fireEvent.changeText(field, 'qa,');
    fireEvent.changeText(field, 'android,');
    expect(onChange).toHaveBeenLastCalledWith(['qa', 'android']);
    fireEvent.press(screen.getByLabelText('Remove qa'));
    expect(onChange).toHaveBeenLastCalledWith(['android']);
  });

  it('shows the counter and blocks past the limit', () => {
    const full = Array.from({ length: 20 }, (_, i) => `t${i}`);
    const onChange = jest.fn();
    render(
      <ChipInput label="Tags" values={full} onChange={onChange} max={20} />
    );
    expect(screen.getByText('20 of 20')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('chipInputField'), 'extra,');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('adds only what fits under the limit', () => {
    const almost = Array.from({ length: 19 }, (_, i) => `t${i}`);
    const onChange = jest.fn();
    render(
      <Stateful initial={almost} onValue={onChange}>
        {(values, set) => (
          <ChipInput label="Tags" values={values} onChange={set} max={20} />
        )}
      </Stateful>
    );
    fireEvent.changeText(screen.getByTestId('chipInputField'), 'a,b,');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith([...almost, 'a']);
    expect(screen.getByText('20 of 20')).toBeTruthy();
  });
});

describe('ChipPicker', () => {
  it('turns Other into a text field', () => {
    const onChange = jest.fn();
    render(
      <Stateful initial="USD" onValue={onChange}>
        {(value, set) => (
          <ChipPicker
            options={['USD', 'EUR']}
            value={value}
            onChange={set}
            otherPlaceholder="Code"
          />
        )}
      </Stateful>
    );
    fireEvent.press(screen.getByText('EUR'));
    expect(onChange).toHaveBeenLastCalledWith('EUR');
    fireEvent.press(screen.getByText('Other…'));
    fireEvent.changeText(screen.getByPlaceholderText('Code'), 'RON');
    expect(onChange).toHaveBeenLastCalledWith('RON');
  });
});

describe('KeyValueRows', () => {
  const renderRows = (initial: KeyValueRow[], onValue: jest.Mock) =>
    render(
      <Stateful initial={initial} onValue={onValue}>
        {(rows, set) => (
          <KeyValueRows label="Data" rows={rows} onChange={set} />
        )}
      </Stateful>
    );

  it('detects numbers while typing', () => {
    const onChange = jest.fn();
    renderRows([{ key: 'level', value: '', type: 'text' }], onChange);
    fireEvent.changeText(screen.getByTestId('kvValue0'), '12');
    expect(onChange).toHaveBeenLastCalledWith([
      { key: 'level', value: '12', type: 'number' },
    ]);
    expect(screen.getByText('123')).toBeTruthy();
  });

  it('changes 1 from number to text when the badge is pressed', () => {
    const onChange = jest.fn();
    renderRows([{ key: 'n', value: '1', type: 'number' }], onChange);
    fireEvent.press(screen.getByText('123'));
    expect(onChange).toHaveBeenLastCalledWith([
      { key: 'n', value: '1', type: 'text' },
    ]);
    expect(screen.getByText('abc')).toBeTruthy();
  });

  it('replaces the rows from pasted JSON', () => {
    const onChange = jest.fn();
    renderRows([{ key: 'a', value: 'b', type: 'text' }], onChange);
    fireEvent.press(screen.getByText('Paste JSON'));
    fireEvent.changeText(screen.getByTestId('jsonPasteField'), '{"n": 2}');
    fireEvent.press(screen.getByText('Apply'));
    expect(onChange).toHaveBeenLastCalledWith([
      { key: 'n', value: '2', type: 'number' },
    ]);
  });

  it('keeps the sheet open on invalid JSON', () => {
    const onChange = jest.fn();
    renderRows([], onChange);
    fireEvent.press(screen.getByText('Paste JSON'));
    fireEvent.changeText(screen.getByTestId('jsonPasteField'), '{oops');
    fireEvent.press(screen.getByText('Apply'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Not valid JSON')).toBeTruthy();
  });
});

describe('MoneyField', () => {
  it('sends cents and shows them', () => {
    const onChange = jest.fn();
    render(
      <Stateful<number | null> initial={null} onValue={onChange}>
        {(cents, set) => (
          <MoneyField cents={cents} currency="USD" onChange={set} />
        )}
      </Stateful>
    );
    fireEvent.changeText(screen.getByTestId('moneyField'), '4.99');
    expect(onChange).toHaveBeenLastCalledWith(499);
    expect(screen.getByText('Sent as 499 cents')).toBeTruthy();
  });

  it('asks for an amount when the text is not one', () => {
    render(<MoneyField cents={499} currency="USD" onChange={jest.fn()} />);
    fireEvent.changeText(screen.getByTestId('moneyField'), '4.999');
    expect(screen.getByText('Enter an amount like 4.99')).toBeTruthy();
  });

  it('stays neutral while empty', () => {
    const onChange = jest.fn();
    render(<MoneyField cents={499} currency="USD" onChange={onChange} />);
    fireEvent.changeText(screen.getByTestId('moneyField'), '');
    expect(onChange).toHaveBeenLastCalledWith(null, '');
    expect(screen.queryByText('Enter an amount like 4.99')).toBeNull();
    expect(screen.queryByText(/Sent as/)).toBeNull();
  });
});

describe('AppButton', () => {
  it('shows the reason and ignores presses when disabled', () => {
    const onPress = jest.fn();
    render(
      <AppButton
        title="Send"
        onPress={onPress}
        disabled
        disabledReason="Name is reserved"
      />
    );
    expect(screen.getByText('Name is reserved')).toBeTruthy();
    fireEvent.press(screen.getByText('Send'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('presses when enabled', () => {
    const onPress = jest.fn();
    render(<AppButton title="Send" onPress={onPress} />);
    fireEvent.press(screen.getByText('Send'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('LinkField', () => {
  it('shows the path pulled out of the link', () => {
    render(
      <LinkField value="https://grovs.link/abc" onChange={jest.fn()} showPath />
    );
    expect(screen.getByText('Path: abc')).toBeTruthy();
  });

  it('pastes from the clipboard', async () => {
    const onChange = jest.fn();
    render(<LinkField value="" onChange={onChange} />);
    await act(async () => {
      fireEvent.press(screen.getByText('Paste'));
    });
    expect(onChange).toHaveBeenCalledWith('mockString');
  });

  it('shows a toast and leaves the field alone when the clipboard cannot be read', async () => {
    jest.spyOn(Clipboard, 'getString').mockRejectedValueOnce(new Error('no'));
    const onChange = jest.fn();
    render(
      <>
        <LinkField value="" onChange={onChange} />
        <ToastHost />
      </>
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Paste'));
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Could not read the clipboard')).toBeTruthy();
  });
});

describe('CopyRow', () => {
  it('copies the value and shows a toast', () => {
    render(
      <>
        <CopyRow label="API key" value="grovst_1234567890" />
        <ToastHost />
      </>
    );
    fireEvent.press(screen.getByText('API key'));
    expect(Clipboard.setString).toHaveBeenCalledWith('grovst_1234567890');
    expect(screen.getByText('Copied')).toBeTruthy();
  });
});

describe('Sheet', () => {
  it('closes when the handle is pressed', () => {
    const onClose = jest.fn();
    render(
      <Sheet visible onClose={onClose}>
        <Text>Body</Text>
      </Sheet>
    );
    fireEvent.press(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows one toast on top of the sheet', () => {
    render(
      <>
        <View testID="app">
          <ToastHost />
        </View>
        <Sheet visible onClose={jest.fn()} heightRatio={null}>
          <CopyRow label="Link" value="https://grovs.link/abc" />
        </Sheet>
      </>
    );
    fireEvent.press(screen.getByText('Link'));
    expect(screen.getAllByText('Copied')).toHaveLength(1);
    expect(within(screen.getByTestId('app')).queryByText('Copied')).toBeNull();
  });
});

describe('FoldRow', () => {
  it('shows the summary folded and the content open', () => {
    render(
      <FoldRow title="More options" summary="2 set">
        <Text>Inside</Text>
      </FoldRow>
    );
    expect(screen.getByText('2 set')).toBeTruthy();
    expect(screen.queryByText('Inside')).toBeNull();
    fireEvent.press(screen.getByText('More options'));
    expect(screen.queryByText('2 set')).toBeNull();
    expect(screen.getByText('Inside')).toBeTruthy();
  });
});

describe('InfoButton', () => {
  it('opens the explanation', () => {
    render(<InfoButton info={{ title: 'Tags', body: 'Labels for links' }} />);
    expect(screen.queryByText('Labels for links')).toBeNull();
    fireEvent.press(screen.getByLabelText('About Tags'));
    expect(screen.getByText('Labels for links')).toBeTruthy();
  });
});
