import { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { type } from '../theme/type';
import { TABS, type Tab } from './nav';
import { TabIcon } from './TabIcons';

const TITLES: Record<Tab, string> = {
  home: 'Home',
  links: 'Links',
  events: 'Events',
  inapp: 'In-app',
};

export function TabBar({
  selected,
  onSelect,
}: {
  selected: Tab;
  onSelect: (tab: Tab) => void;
}) {
  const { colors } = useTheme();
  const bottomInset = useContext(SafeAreaInsetsContext)?.bottom ?? 0;
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: bottomInset,
        },
      ]}
    >
      {TABS.map((tab) => {
        const on = tab === selected;
        const color = on ? colors.text : colors.textMuted;
        return (
          <Pressable
            key={tab}
            onPress={() => onSelect(tab)}
            accessibilityRole="tab"
            accessibilityLabel={TITLES[tab]}
            accessibilityState={{ selected: on }}
            style={styles.item}
          >
            <View
              style={[
                styles.indicator,
                on && { backgroundColor: colors.chipFill },
              ]}
            >
              <TabIcon tab={tab} color={color} />
            </View>
            <Text style={[type.label, { color }]}>{TITLES[tab]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1 },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingTop: 10,
    paddingBottom: 12,
  },
  indicator: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
