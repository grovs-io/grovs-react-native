import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exampleStore } from '../store/exampleStore';
import { useTheme } from '../theme/ThemeContext';
import { ToastHost } from './controls/Toast';
import { EventsScreen } from './events/EventsScreen';
import { HomeScreen } from './home/HomeScreen';
import { ExcludedScreen } from './inapp/ExcludedScreen';
import { InAppScreen } from './inapp/InAppScreen';
import { LinksScreen } from './links/LinksScreen';
import { ConsoleStrip } from './logs/ConsoleStrip';
import { LogsPanel } from './logs/LogsPanel';
import { isTab, NavContext, TABS, type Nav, type Tab } from './nav';
import { SettingsScreen } from './settings/SettingsScreen';
import { TabBar } from './TabBar';
import { useLog } from './useStore';

const TAB_KEY = 'tab';
const TRANSITION_MS = 260;

const SCREENS: Record<Tab, () => React.ReactElement> = {
  home: HomeScreen,
  links: LinksScreen,
  events: EventsScreen,
  inapp: InAppScreen,
};

type Panel = { open: boolean; entryId?: number };

function useSavedTab(): [Tab, (tab: Tab) => void] {
  const [tab, setTab] = useState<Tab>('home');
  const picked = useRef(false);
  useEffect(() => {
    let active = true;
    exampleStore
      .load()
      .catch(() => undefined)
      .then(() => {
        const saved = exampleStore.get(TAB_KEY);
        if (active && !picked.current && isTab(saved)) setTab(saved);
      });
    return () => {
      active = false;
    };
  }, []);
  const select = (next: Tab) => {
    picked.current = true;
    setTab(next);
    exampleStore.set(TAB_KEY, next);
  };
  return [tab, select];
}

/** The keyboard covers the strip and tab bar, so they step aside while typing. */
function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const prefix = Platform.OS === 'ios' ? 'keyboardWill' : 'keyboardDid';
    const show = Keyboard.addListener(`${prefix}Show`, () => setVisible(true));
    const hide = Keyboard.addListener(`${prefix}Hide`, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/** Tabs fade in with a short slide toward the side of the new tab. */
function TabContent({ tab }: { tab: Tab }) {
  const visited = useRef<Tab[]>([]);
  if (!visited.current.includes(tab)) visited.current.push(tab);
  const progress = useRef(new Animated.Value(1)).current;
  const last = useRef({ tab, direction: 1 });
  if (last.current.tab !== tab) {
    const forward = TABS.indexOf(tab) > TABS.indexOf(last.current.tab);
    last.current = { tab, direction: forward ? 1 : -1 };
    progress.setValue(0);
  }
  const { direction } = last.current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tab, progress]);

  const slide = {
    opacity: progress,
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [direction * 24, 0],
        }),
      },
    ],
  };
  return (
    <>
      {visited.current.map((shown) => {
        const ScreenForTab = SCREENS[shown];
        const current = shown === tab;
        return (
          <Animated.View
            key={shown}
            style={[styles.fill, current ? slide : styles.hidden]}
          >
            <ScreenForTab />
          </Animated.View>
        );
      })}
    </>
  );
}

/** A full screen page that slides in from the right over the tabs. */
function Overlay({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: TRANSITION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => finished && !visible && setMounted(false));
  }, [visible, progress]);

  if (!mounted) return null;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0],
  });
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          transform: [{ translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export function Scaffold() {
  const { colors } = useTheme();
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useSavedTab();
  const [settings, setSettings] = useState(false);
  const [excluded, setExcluded] = useState(false);
  const [panel, setPanel] = useState<Panel>({ open: false });
  const { entries, unseenError } = useLog();
  const typing = useKeyboardVisible();

  const nav = useMemo<Nav>(
    () => ({
      openSettings: () => setSettings(true),
      closeSettings: () => setSettings(false),
      openExcluded: () => setExcluded(true),
      closeExcluded: () => setExcluded(false),
      openLogs: (entryId) => setPanel({ open: true, entryId }),
    }),
    []
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (excluded) setExcluded(false);
      else if (settings) setSettings(false);
      else return false;
      return true;
    });
    return () => sub.remove();
  }, [excluded, settings]);

  return (
    <NavContext.Provider value={nav}>
      <StatusBar
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={[styles.fill, { paddingTop: insets.top }]}>
            <TabContent tab={tab} />
          </View>
        </TouchableWithoutFeedback>
        {typing ? null : (
          <>
            <ConsoleStrip
              latest={entries[0]}
              unseenError={unseenError}
              onOpen={() => nav.openLogs()}
            />
            <TabBar selected={tab} onSelect={setTab} />
          </>
        )}
        <Overlay visible={settings}>
          <SettingsScreen />
        </Overlay>
        <Overlay visible={excluded}>
          <ExcludedScreen />
        </Overlay>
        <LogsPanel
          visible={panel.open}
          focusEntryId={panel.entryId}
          onClose={() => setPanel({ open: false })}
        />
        <ToastHost />
      </View>
    </NavContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hidden: { display: 'none' },
});
