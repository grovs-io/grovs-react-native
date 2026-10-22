import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';

/** Smallest tap target, so neighbours are hard to hit by mistake. */
export const MIN_TOUCH = 44;

/** Height of text fields and buttons, so they line up side by side. */
export const FIELD_HEIGHT = 44;

export function TextAction({
  title,
  onPress,
  color,
  disabled = false,
  accessibilityLabel,
  style,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.textAction,
        style,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          type.label,
          { color: disabled ? colors.textMuted : (color ?? colors.accent) },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export type ButtonStyle = 'primary' | 'outline' | 'text';

export function AppButton({
  title,
  onPress,
  style = 'primary',
  small = false,
  disabled = false,
  disabledReason,
  onLongPress,
  containerStyle,
}: {
  title: string;
  onPress: () => void;
  style?: ButtonStyle;
  small?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  /** Stays available while disabled, so saved values can still be edited. */
  onLongPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [background, foreground] = disabled
    ? style === 'text'
      ? ['transparent', colors.textMuted]
      : [colors.neutralDot, colors.onAccent]
    : {
        primary: [colors.accent, colors.onAccent],
        outline: [colors.background, colors.text],
        text: ['transparent', colors.accent],
      }[style];
  return (
    <View style={containerStyle}>
      <Pressable
        onPress={() => !disabled && onPress()}
        onLongPress={onLongPress}
        disabled={disabled && !onLongPress}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityHint={disabled ? disabledReason : undefined}
        style={({ pressed }) => [
          styles.button,
          { borderRadius: small ? 8 : 9, backgroundColor: background },
          !disabled &&
            style === 'outline' && {
              borderWidth: 1,
              borderColor: colors.border,
            },
          pressed && styles.pressed,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            small ? type.caption : type.bodyStrong,
            { fontFamily: type.heading.fontFamily, color: foreground },
          ]}
        >
          {title}
        </Text>
      </Pressable>
      {disabled && disabledReason ? (
        <Text
          style={[type.caption, styles.reason, { color: colors.textMuted }]}
        >
          {disabledReason}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  textAction: {
    minHeight: MIN_TOUCH,
    minWidth: MIN_TOUCH,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minHeight: FIELD_HEIGHT,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  reason: { marginTop: 4 },
});
