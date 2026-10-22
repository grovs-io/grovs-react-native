import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { MIN_TOUCH } from './Buttons';

const DISMISS_FRACTION = 0.25;
const DISMISS_VELOCITY = 1.5;
const MAX_WRAPPED_RATIO = 0.9;

/**
 * Bottom sheet over the whole app. With `heightRatio={null}` it wraps its
 * content and scrolls. Tap the handle or drag it down to close.
 */
export function Sheet({
  visible,
  onClose,
  heightRatio = 0.8,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  heightRatio?: number | null;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
    }
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 250 : 200,
      useNativeDriver: true,
    }).start(({ finished }) => finished && !visible && setMounted(false));
  }, [visible, progress, drag]);

  const pan = useMemo(() => {
    const settle = () =>
      Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        const far = g.dy > sheetHeight.current * DISMISS_FRACTION;
        if (far || g.vy > DISMISS_VELOCITY) onCloseRef.current();
        else settle();
      },
      onPanResponderTerminate: settle,
    });
  }, [drag]);

  const translateY = Animated.add(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [screenHeight, 0],
    }),
    drag
  );
  const size =
    heightRatio === null
      ? { maxHeight: screenHeight * MAX_WRAPPED_RATIO }
      : { height: screenHeight * heightRatio };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.scrim, opacity: progress },
        ]}
      >
        <Pressable
          style={styles.fill}
          onPress={onClose}
          accessible={false}
          importantForAccessibility="no"
        />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
        style={styles.bottom}
      >
        <Animated.View
          onLayout={(e) => {
            sheetHeight.current = e.nativeEvent.layout.height;
          }}
          style={[
            styles.sheet,
            size,
            {
              backgroundColor: colors.background,
              paddingBottom: bottomInset,
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...pan.panHandlers}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.handleArea}
            >
              <View
                style={[styles.handle, { backgroundColor: colors.neutralDot }]}
              />
            </Pressable>
          </View>
          {heightRatio === null ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.content, styles.fill]}>{children}</View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bottom: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleArea: {
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: { width: 36, height: 4, borderRadius: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 14 },
});
