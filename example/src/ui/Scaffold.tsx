import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { showToast, ToastHost } from './controls/Toast';
import { EventsScreen } from './events/EventsScreen';
import { HomeScreen } from './home/HomeScreen';
import { ExcludedScreen } from './inapp/ExcludedScreen';
import { InAppScreen } from './inapp/InAppScreen';
import { LinksScreen } from './links/LinksScreen';
import { inspectLink } from './links/useLinks';
import { ConsoleStrip } from './logs/ConsoleStrip';
import { LogsPanel } from './logs/LogsPanel';
import { isTab, NavContext, TABS, type Nav, type Tab } from './nav';
import { SettingsScreen } from './settings/SettingsScreen';
import { TabBar } from './TabBar';
import { useLog } from './useStore';

const TAB_KEY = 'tab';
const TRANSITION_MS = 260;
const SLIDE_DISTANCE = 24;

const SCREENS: Record<Tab, () => React.ReactElement> = {
  home: HomeScreen,
  links: LinksScreen,
  events: EventsScreen,
  inapp: InAppScreen,
};

type Panel = { open: boolean; entryId?: number };

/** The tab is null until the store has loaded, so the saved tab shows first. */
function useSavedTab(): [Tab | null, (tab: Tab) => void] {
  const [tab, setTab] = useState<Tab | null>(null);
  useEffect(() => {
    let active = true;
    exampleStore
      .load()
      .catch(() => undefined)
      .then(() => {
        const saved = exampleStore.get(TAB_KEY);
        if (active) setTab(isTab(saved) ? saved : 'home');
      });
    return () => {
      active = false;
    };
  }, []);
  const select = (next: Tab) => {
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
  const [visited, setVisited] = useState<Tab[]>([tab]);
  const opacity = useRef(new Animated.Value(1)).current;
  const offset = useRef(new Animated.Value(0)).current;
  const previous = useRef(tab);

  useLayoutEffect(() => {
    if (previous.current === tab) return;
    const forward = TABS.indexOf(tab) > TABS.indexOf(previous.current);
    previous.current = tab;
    setVisited((list) => (list.includes(tab) ? list : [...list, tab]));
    opacity.setValue(0);
    offset.setValue(forward ? SLIDE_DISTANCE : -SLIDE_DISTANCE);
    const timing = (value: Animated.Value, toValue: number) =>
      Animated.timing(value, {
        toValue,
        duration: TRANSITION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    Animated.parallel([timing(opacity, 1), timing(offset, 0)]).start();
  }, [tab, opacity, offset]);

  const shown = visited.includes(tab) ? visited : [...visited, tab];
  const slide = { opacity, transform: [{ translateX: offset }] };
  return (
    <>
      {shown.map((screen) => {
        const ScreenForTab = SCREENS[screen];
        const current = screen === tab;
        return (
          <Animated.View
            key={screen}
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

  if (tab === null) {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]} />
    );
  }

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
          onInspect={(link) =>
            inspectLink(link)
              .then(nav.openLogs)
              .catch(() => showToast('Could not inspect the link'))
          }
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
