import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { extractLinkPath, isWebUrl } from '../../data/linkTools';
import {
  currencySymbol,
  formatCents,
  parseAmountToCents,
} from '../../data/money';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { FieldLabel, HelpText } from './Basics';
import { TextAction } from './Buttons';
import { ChipRow } from './Chips';
import type { Info } from './Info';
import { AppTextField, inlineAction } from './TextField';

export {
  AppTextField,
  type AppTextFieldProps,
  type Keyboard,
} from './TextField';

export function SuggestField({
  value,
  onChange,
  suggestions,
  label,
  info,
  placeholder,
  error,
  mono,
  returnKey,
  onSubmit,
}: {
  value: string;
  onChange: (text: string) => void;
  suggestions: string[];
  label?: string;
  info?: Info;
  placeholder?: string;
  error?: string | null;
  mono?: boolean;
  returnKey?: 'next' | 'done';
  onSubmit?: () => void;
}) {
  const unique = [...new Set(suggestions)];
  return (
    <View>
      {label ? <FieldLabel text={label} info={info} /> : null}
      <AppTextField
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        mono={mono}
        error={!!error}
        returnKey={returnKey}
        onSubmit={onSubmit}
      />
      {error ? <HelpText text={error} isError /> : null}
      {unique.length > 0 ? (
        <View style={styles.suggestions}>
          <ChipRow values={unique} selected={value} onPick={onChange} />
        </View>
      ) : null}
    </View>
  );
}

export function LinkField({
  value,
  onChange,
  label,
  info,
  placeholder = 'https://',
  showPath = false,
  onDone,
}: {
  value: string;
  onChange: (text: string) => void;
  label?: string;
  info?: Info;
  placeholder?: string;
  /** For link lookups: accepts a full link, host/path or just the path. */
  showPath?: boolean;
  onDone?: () => void;
}) {
  const paste = async () => {
    const text = (await Clipboard.getString()).trim();
    if (text === '') return;
    onChange(text);
    if (showPath) onDone?.();
  };
  const path = showPath ? extractLinkPath(value) : null;
  let help: { text: string; isError: boolean } | null = null;
  if (value.trim() !== '') {
    if (showPath) {
      help = path
        ? { text: `Path: ${path}`, isError: false }
        : { text: 'No path found', isError: true };
    } else if (!isWebUrl(value)) {
      help = { text: 'Must start with http:// or https://', isError: true };
    }
  }
  return (
    <View>
      {label ? <FieldLabel text={label} info={info} /> : null}
      <AppTextField
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        mono
        keyboard="url"
        onSubmit={onDone}
        trailing={
          <TextAction title="Paste" onPress={paste} style={inlineAction} />
        }
      />
      {help ? <HelpText text={help.text} isError={help.isError} /> : null}
    </View>
  );
}

const AMOUNT_CHARS = /[^\d.,]/g;

/** Amount typed in normal units, sent as whole cents. */
export function MoneyField({
  cents,
  currency,
  onChange,
}: {
  cents: number | null;
  currency: string;
  /** Gets null while the text is not a valid amount, and the text itself. */
  onChange: (cents: number | null, text: string) => void;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState(cents === null ? '' : formatCents(cents));
  const [shownCents, setShownCents] = useState(cents);
  if (cents !== shownCents) {
    setShownCents(cents);
    if (cents !== parseAmountToCents(text)) {
      setText(cents === null ? '' : formatCents(cents));
    }
  }
  const parsed = parseAmountToCents(text);
  const change = (input: string) => {
    const clean = input.replace(AMOUNT_CHARS, '');
    setText(clean);
    onChange(parseAmountToCents(clean), clean);
  };
  return (
    <View>
      <AppTextField
        value={text}
        onChange={change}
        keyboard="decimal"
        error={parsed === null}
        clearable={false}
        textStyle={type.amount}
        testID="moneyField"
        leading={
          <Text style={[type.amount, { color: colors.textMuted }]}>
            {currencySymbol(currency)}
          </Text>
        }
      />
      <HelpText
        text={
          parsed === null
            ? 'Enter an amount like 4.99'
            : `Sent as ${parsed} cents`
        }
        isError={parsed === null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  suggestions: { marginTop: 6 },
});
