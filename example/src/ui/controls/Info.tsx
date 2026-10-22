import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { fonts, type } from '../../theme/type';
import { MIN_TOUCH, TextAction } from './Buttons';
import { Sheet } from './Sheet';

/** A short explanation shown behind a "?" next to a label. */
export type Info = { title: string; body: string };

export function InfoButton({ info }: { info: Info }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`About ${info.title}`}
        style={styles.button}
      >
        <View style={[styles.circle, { borderColor: colors.textFaint }]}>
          <Text style={[styles.mark, { color: colors.textMuted }]}>?</Text>
        </View>
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} heightRatio={null}>
        <View style={styles.body}>
          <Text style={[type.heading, { color: colors.text }]}>
            {info.title}
          </Text>
          <Text style={[type.body, { color: colors.textMuted }]}>
            {info.body}
          </Text>
          <View style={styles.end}>
            <TextAction title="Got it" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { fontFamily: fonts.semibold, fontSize: 10 },
  body: { gap: 10 },
  end: { alignItems: 'flex-end' },
});
