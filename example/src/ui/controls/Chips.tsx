import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { FieldLabel } from './Basics';
import type { Info } from './Info';
import { AppTextField } from './TextField';

export function Chip({
  text,
  onPress,
  selected = false,
  dashed = false,
  removable = false,
  color,
}: {
  text: string;
  onPress: () => void;
  selected?: boolean;
  dashed?: boolean;
  removable?: boolean;
  color?: string;
}) {
  const { colors } = useTheme();
  const textColor =
    color ??
    (selected ? colors.accent : dashed ? colors.textMuted : colors.text);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={removable ? `Remove ${text}` : undefined}
      accessibilityState={{ selected }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.accentSoft : colors.background,
          borderColor: selected ? colors.accent : colors.border,
          borderStyle: dashed ? 'dashed' : 'solid',
        },
        pressed && styles.pressed,
      ]}
    >
      <Text numberOfLines={1} style={[type.caption, { color: textColor }]}>
        {text}
      </Text>
      {removable ? (
        <Text style={[type.caption, { color: colors.textFaint }]}> ×</Text>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({
  values,
  selected,
  onPick,
  label = (value) => value,
}: {
  values: string[];
  selected?: string | null;
  onPick: (value: string) => void;
  label?: (value: string) => string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.chipRow}
    >
      {values.map((value) => (
        <Chip
          key={value}
          text={label(value)}
          onPress={() => onPick(value)}
          selected={value === selected}
        />
      ))}
    </ScrollView>
  );
}

/** One of many. With `otherPlaceholder` or `otherLabel`, "Other…" turns into a text field. */
export function ChipPicker({
  options,
  value,
  onChange,
  label,
  info,
  otherLabel,
  otherPlaceholder,
  display = (option) => option,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  info?: Info;
  otherLabel?: string;
  otherPlaceholder?: string;
  display?: (option: string) => string;
}) {
  const [editingOther, setEditingOther] = useState(false);
  const [typed, setTyped] = useState('');
  const allowOther = otherLabel !== undefined || otherPlaceholder !== undefined;
  const custom = value !== '' && !options.includes(value) ? value : null;
  const showOther = allowOther && (editingOther || custom !== null);
  const otherText = editingOther ? typed : (custom ?? '');
  return (
    <View>
      {label ? <FieldLabel text={label} info={info} /> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.pickerRow}
      >
        {options.map((option) => (
          <Chip
            key={option}
            text={display(option)}
            onPress={() => {
              setEditingOther(false);
              onChange(option);
            }}
            selected={option === value && !editingOther}
          />
        ))}
        {allowOther ? (
          <Chip
            text={otherText || (otherLabel ?? 'Other…')}
            onPress={() => {
              setTyped(custom ?? '');
              setEditingOther(true);
            }}
            selected={showOther}
            dashed={!showOther}
          />
        ) : null}
      </ScrollView>
      {showOther ? (
        <AppTextField
          value={otherText}
          onChange={(text) => {
            setTyped(text);
            setEditingOther(true);
            onChange(text);
          }}
          placeholder={otherPlaceholder}
          style={styles.otherField}
        />
      ) : null}
    </View>
  );
}

/** A list of strings: comma or Done adds a chip, tapping a chip removes it. */
export function ChipInput({
  values,
  onChange,
  label,
  info,
  placeholder = 'Add',
  max,
  maxLength,
  fieldTestID = 'chipInputField',
}: {
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  info?: Info;
  placeholder?: string;
  max?: number;
  /** Longest a single chip may be. */
  maxLength?: number;
  fieldTestID?: string;
}) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');
  const full = max !== undefined && values.length >= max;

  const add = (parts: string[]) => {
    const fresh = [
      ...new Set(
        parts.map((part) => part.trim()).filter((part) => part !== '')
      ),
    ].filter((part) => !values.includes(part));
    const room =
      max === undefined ? fresh.length : Math.max(0, max - values.length);
    const added = fresh.slice(0, room);
    if (added.length > 0) onChange([...values, ...added]);
  };
  const change = (text: string) => {
    const parts = text.split(',');
    if (parts.length > 1) {
      add(parts.slice(0, -1));
      setDraft(parts[parts.length - 1]!);
    } else {
      setDraft(text);
    }
  };
  const commitDraft = () => {
    add([draft]);
    setDraft('');
  };

  return (
    <View>
      {label !== undefined || max !== undefined ? (
        <FieldLabel
          text={label ?? ''}
          info={info}
          trailing={
            max !== undefined ? `${values.length} of ${max}` : undefined
          }
        />
      ) : null}
      <View
        style={[
          styles.chipInput,
          {
            borderColor:
              max !== undefined && values.length > max
                ? colors.error
                : colors.border,
          },
        ]}
      >
        {values.map((value) => (
          <Chip
            key={value}
            text={value}
            onPress={() => onChange(values.filter((v) => v !== value))}
            removable
          />
        ))}
        <TextInput
          value={draft}
          onChangeText={change}
          onSubmitEditing={commitDraft}
          onBlur={() => draft.trim() !== '' && commitDraft()}
          editable={!full}
          placeholder={full ? 'Limit reached' : placeholder}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          returnKeyType="done"
          submitBehavior="submit"
          maxLength={maxLength}
          testID={fieldTestID}
          accessibilityLabel={label}
          style={[type.body, styles.chipField, { color: colors.text }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pressed: { opacity: 0.7 },
  chipRow: { gap: 8 },
  pickerRow: { gap: 6 },
  otherField: { marginTop: 6 },
  chipInput: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  chipField: {
    flexGrow: 1,
    minWidth: 90,
    minHeight: 36,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
});
