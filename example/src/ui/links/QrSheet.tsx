import { Platform, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { openCommand } from '../../data/linkTools';
import { useTheme } from '../../theme/ThemeContext';
import { type } from '../../theme/type';
import { copyToClipboard } from '../controls/Basics';
import { AppButton } from '../controls/Buttons';
import { Sheet } from '../controls/Sheet';

const OS = Platform.OS === 'android' ? 'android' : 'ios';

/** Name of the tool `openCommand` writes for this platform. */
export const COMMAND_LABEL = OS === 'android' ? 'adb' : 'simctl';

export const copyOpenCommand = (link: string) =>
  copyToClipboard(openCommand(link, OS));

export function QrSheet({
  link,
  visible,
  onClose,
}: {
  link: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} heightRatio={null}>
      <View style={styles.body}>
        <Text style={[type.heading, { color: colors.text }]}>
          Scan on another phone
        </Text>
        <Text style={[type.caption, { color: colors.textMuted }]}>
          Tests install and deferred deep links
        </Text>
        <View style={styles.code}>
          <QRCode
            value={link}
            size={220}
            color={colors.text}
            backgroundColor={colors.background}
          />
        </View>
        <Text style={[type.mono, { color: colors.accent }]}>{link}</Text>
        <View style={styles.buttons}>
          <AppButton
            title="Copy link"
            style="outline"
            onPress={() => copyToClipboard(link)}
            containerStyle={styles.grow}
          />
          <AppButton
            title={`Copy ${COMMAND_LABEL}`}
            style="outline"
            onPress={() => copyOpenCommand(link)}
            containerStyle={styles.grow}
          />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center' },
  code: { paddingVertical: 14 },
  buttons: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 8,
    paddingTop: 12,
  },
  grow: { flex: 1 },
});
