import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';

const SHOW_MS = 1800;

type Listener = (text: string) => void;
const listeners = new Set<Listener>();

/** Shows a short message at the bottom of the app. Needs a mounted ToastHost. */
export function showToast(text: string) {
  listeners.forEach((listener) => listener(text));
}

export function ToastHost() {
  const { colors } = useTheme();
  const [text, setText] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const listener: Listener = (next) => {
      clearTimeout(timer);
      setText(next);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
      timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(({ finished }) => finished && setText(null));
      }, SHOW_MS);
    };
    listeners.add(listener);
    return () => {
      clearTimeout(timer);
      listeners.delete(listener);
    };
  }, [opacity]);

  if (text === null) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.toast, { backgroundColor: colors.text, opacity }]}
    >
      <Text style={[type.bodyStrong, { color: colors.background }]}>
        {text}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 96,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
