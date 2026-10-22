import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { FIELD_HEIGHT, TextAction } from './Buttons';

/** Style for a TextAction inside a field, so it keeps the field's height. */
export const inlineAction: ViewStyle = {
  minHeight: FIELD_HEIGHT - 2,
  marginRight: -6,
};

export type Keyboard = 'url' | 'number' | 'decimal' | 'text';

const KEYBOARDS: Record<Keyboard, KeyboardTypeOptions> = {
  url: 'url',
  number: 'number-pad',
  decimal: 'decimal-pad',
  text: 'default',
};

export type AppTextFieldProps = {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  mono?: boolean;
  error?: boolean;
  multiline?: boolean;
  keyboard?: Keyboard;
  /** "next" keeps the keyboard open so onSubmit can focus the next field. */
  returnKey?: 'next' | 'done';
  onSubmit?: () => void;
  onBlur?: () => void;
  /** Shows a clear button while there is text and no trailing content. */
  clearable?: boolean;
  textStyle?: StyleProp<TextStyle>;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxLength?: number;
  editable?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(
  function AppTextField(
    {
      value,
      onChange,
      placeholder = '',
      mono = false,
      error = false,
      multiline = false,
      keyboard = 'text',
      returnKey = 'done',
      onSubmit,
      onBlur,
      clearable = true,
      textStyle,
      leading,
      trailing,
      style,
      maxLength,
      editable,
      testID,
      accessibilityLabel,
    },
    ref
  ) {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);
    const borderColor = error
      ? colors.error
      : focused
        ? colors.accent
        : colors.border;
    const showClear = clearable && !multiline && !trailing && value !== '';
    return (
      <View
        style={[
          styles.field,
          multiline ? styles.multiline : styles.singleLine,
          { borderColor, backgroundColor: colors.background },
          style,
        ]}
      >
        {leading}
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.accent}
          cursorColor={colors.accent}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          keyboardType={KEYBOARDS[keyboard]}
          multiline={multiline}
          returnKeyType={multiline ? 'default' : returnKey}
          submitBehavior={
            multiline
              ? 'newline'
              : returnKey === 'next'
                ? 'submit'
                : 'blurAndSubmit'
          }
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          maxLength={maxLength}
          editable={editable}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          style={[
            mono ? type.mono : type.body,
            styles.input,
            multiline ? styles.inputMultiline : styles.inputSingleLine,
            { color: colors.text },
            textStyle,
          ]}
        />
        {showClear ? (
          <TextAction
            title="✕"
            onPress={() => onChange('')}
            color={colors.textFaint}
            accessibilityLabel="Clear"
            style={inlineAction}
          />
        ) : null}
        {trailing}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    minHeight: FIELD_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 6,
  },
  singleLine: { alignItems: 'center' },
  multiline: { alignItems: 'flex-start', paddingVertical: 10 },
  input: { flex: 1, paddingVertical: 0, paddingHorizontal: 0 },
  inputSingleLine: { minHeight: FIELD_HEIGHT - 2 },
  inputMultiline: { textAlignVertical: 'top' },
});
