import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  detectType,
  rowsFromJson,
  rowsToJson,
  type KeyValueRow,
  type ValueType,
} from '../../data/keyValue';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { FieldLabel, HelpText, readClipboard } from './Basics';
import { AppButton, MIN_TOUCH, TextAction } from './Buttons';
import { Chip } from './Chips';
import type { Info } from './Info';
import { Sheet } from './Sheet';
import { AppTextField } from './TextField';

const TYPES: ValueType[] = ['text', 'number', 'bool'];
const BADGES: Record<ValueType, string> = {
  text: 'abc',
  number: '123',
  bool: 'y/n',
};
const TYPE_NAMES: Record<ValueType, string> = {
  text: 'text',
  number: 'number',
  bool: 'true/false',
};

function fits(valueType: ValueType, value: string): boolean {
  return (
    valueType === 'text' ||
    value.trim() === '' ||
    detectType(value) === valueType
  );
}

/** The next type in the cycle that the value can be sent as. */
function nextType(row: KeyValueRow): ValueType {
  const start = TYPES.indexOf(row.type);
  for (let step = 1; step < TYPES.length; step++) {
    const candidate = TYPES[(start + step) % TYPES.length]!;
    if (fits(candidate, row.value)) return candidate;
  }
  return row.type;
}

/** Keeps a type the user picked while it still fits, otherwise detects it again. */
function withValue(row: KeyValueRow, value: string): KeyValueRow {
  const picked = row.type !== detectType(row.value);
  const keep = picked && fits(row.type, value);
  return { ...row, value, type: keep ? row.type : detectType(value) };
}

export function KeyValueRows({
  rows,
  onChange,
  label,
  info,
  suggestedKeys = [],
  textOnly = false,
}: {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  label?: string;
  info?: Info;
  suggestedKeys?: string[];
  /** Plain strings only: no type badge and no JSON paste. */
  textOnly?: boolean;
}) {
  const { colors } = useTheme();
  const valueFields = useRef<Array<TextInput | null>>([]);
  const [pasting, setPasting] = useState(false);
  const replace = (index: number, row: KeyValueRow) =>
    onChange(rows.map((current, i) => (i === index ? row : current)));
  const addRow = (key: string) =>
    onChange([...rows, { key, value: '', type: 'text' }]);
  const missingKeys = suggestedKeys.filter(
    (key) => !rows.some((row) => row.key === key)
  );

  return (
    <View>
      {label !== undefined || !textOnly ? (
        <FieldLabel
          text={label ?? ''}
          info={info}
          action={textOnly ? undefined : 'Paste JSON'}
          onAction={() => setPasting(true)}
        />
      ) : null}
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          <AppTextField
            value={row.key}
            onChange={(key) => replace(i, { ...row, key })}
            placeholder="key"
            returnKey="next"
            onSubmit={() => valueFields.current[i]?.focus()}
            clearable={false}
            style={styles.key}
            testID={`kvKey${i}`}
          />
          <AppTextField
            ref={(field) => {
              valueFields.current[i] = field;
            }}
            value={row.value}
            onChange={(value) =>
              replace(i, textOnly ? { ...row, value } : withValue(row, value))
            }
            placeholder="value"
            clearable={false}
            style={styles.value}
            testID={`kvValue${i}`}
            trailing={
              textOnly ? null : (
                <Pressable
                  onPress={() => replace(i, { ...row, type: nextType(row) })}
                  accessibilityRole="button"
                  accessibilityLabel={`Sent as ${TYPE_NAMES[row.type]}, change type`}
                  hitSlop={6}
                  style={styles.badge}
                >
                  <Text style={[type.monoSmall, { color: colors.textFaint }]}>
                    {BADGES[row.type]}
                  </Text>
                </Pressable>
              )
            }
          />
          <TextAction
            title="×"
            onPress={() => onChange(rows.filter((_, j) => j !== i))}
            color={colors.textFaint}
            accessibilityLabel={`Remove ${row.key || 'row'}`}
          />
        </View>
      ))}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.addRow}
      >
        <Chip text="+ Add" onPress={() => addRow('')} dashed />
        {missingKeys.map((key) => (
          <Chip key={key} text={`+ ${key}`} onPress={() => addRow(key)} />
        ))}
      </ScrollView>
      {textOnly ? null : (
        <Sheet
          visible={pasting}
          onClose={() => setPasting(false)}
          heightRatio={null}
        >
          <JsonPaste
            rows={rows}
            onApply={(pasted) => {
              onChange(pasted);
              setPasting(false);
            }}
          />
        </Sheet>
      )}
    </View>
  );
}

function JsonPaste({
  rows,
  onApply,
}: {
  rows: KeyValueRow[];
  onApply: (rows: KeyValueRow[]) => void;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState(rows.length === 0 ? '{}' : rowsToJson(rows));
  const [error, setError] = useState<string | null>(null);
  const apply = () => {
    try {
      onApply(rowsFromJson(text));
    } catch {
      setError('Not valid JSON');
    }
  };
  return (
    <View>
      <Text style={[type.heading, styles.title, { color: colors.text }]}>
        Paste JSON
      </Text>
      <AppTextField
        value={text}
        onChange={(next) => {
          setText(next);
          setError(null);
        }}
        mono
        multiline
        style={styles.json}
        testID="jsonPasteField"
      />
      <HelpText
        text={error ?? 'An object, e.g. {"level": 3}'}
        isError={error !== null}
      />
      <View style={styles.buttons}>
        <AppButton
          title="Paste"
          style="outline"
          onPress={async () => {
            const pasted = await readClipboard();
            if (pasted !== null) setText(pasted);
          }}
          containerStyle={styles.button}
        />
        <AppButton
          title="Apply"
          onPress={apply}
          containerStyle={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  key: { flex: 1 },
  value: { flex: 1.2 },
  badge: {
    minHeight: MIN_TOUCH - 12,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  addRow: { gap: 8 },
  title: { marginBottom: 8 },
  json: { minHeight: 160 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: { flex: 1 },
});
