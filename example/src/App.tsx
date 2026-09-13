/* eslint-disable react-native/no-inline-styles */
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Button,
  Clipboard,
  Platform,
  Switch,
} from 'react-native';
import Grovs from 'react-native-grovs-wrapper';
import { useEffect, useState } from 'react';

Grovs.setIdentifier('React native id');
Grovs.setAttributes({
  'string': 'string value',
  'boolean': true,
  'number': 13,
  'number 2': 13.2,
  'array': ['1', 2, true],
});

export default function App() {
  useEffect(() => {
    fetchUnreadMessages();

    const listener = Grovs.onDeeplinkReceived((data) => {
      console.log(`Opened link data: ${JSON.stringify(data)}`);
      setLabel1(`Opened link data: ${JSON.stringify(data)}`);
    });

    return () => {
      listener.remove(); // Stop receiving events
    };
  }, []);

  const [label1, setLabel1] = useState('Opened link data:');
  const [label2, setLabel2] = useState('Generated link:');
  const [label3, setLabel3] = useState('Unread messages:');
  const [label4, setLabel4] = useState('Revenue:');
  const [sdkEnabled, setSdkEnabled] = useState(true);
  const [copyToClipboard, setCopyToClipboard] = useState(false);

  const handleToggleSDK = (value: boolean) => {
    setSdkEnabled(value);
    Grovs.setSDK(value);
  };

  const handleGenerateLinkPress = () => {
    generateLink();
  };

  const handleShowNotificationsPress = async () => {
    try {
      await Grovs.displayMessages();
    } catch (error) {
      setLabel3(`Messages error: ${error}`);
    }
  };

  const copyText = (text: string) => {
    Clipboard.setString(text);
    console.log(`Copied: "${text}"`);
  };

  async function generateLink() {
    try {
      const link = await Grovs.generateLink({
        title: 'Test link',
        subtitle: 'Test subtitle',
        data: { age: 25, city: 'New York' },
        customRedirects: {
          android: {
            link: 'https://www.grovs.io/android',
            open_if_app_installed: true,
          },
          ios: {
            link: 'https://www.grovs.io/ios',
            open_if_app_installed: true,
          },
          desktop: {
            link: 'https://www.grovs.io/desktop',
            open_if_app_installed: true,
          },
        },
        showPreviewIos: false,
        showPreviewAndroid: false,
        tracking: {
          utm_medium: 'social',
          utm_source: 'social_network',
          utm_campaign: 'react_native_integration',
        },
        copyToClipboardIos: copyToClipboard,
        copyToClipboardAndroid: copyToClipboard,
      });
      console.log(`Generated link: ${link}`);
      setLabel2(`Generated link: ${link}`);
    } catch (error) {
      console.log('Error generating link:', error);
      setLabel2(`Generated link error: ${error}`);
    }
  }

  async function handleLogInAppPurchase() {
    try {
      const success = await Grovs.logInAppPurchase(
        Platform.OS === 'ios'
          ? { transactionId: '123456789' }
          : {
              originalJson: JSON.stringify({
                productId: 'premium_monthly',
                purchaseToken: 'demo-token',
              }),
            }
      );
      setLabel4(`In-app purchase: ${success}`);
      console.log('In-app purchase tracked:', success);
    } catch (error) {
      setLabel4(`In-app purchase error: ${error}`);
      console.log('Error tracking in-app purchase:', error);
    }
  }

  async function handleLogCustomPurchase() {
    try {
      const success = await Grovs.logCustomPurchase(
        'buy',
        999,
        'USD',
        'premium_monthly'
      );
      setLabel4(`Custom purchase: ${success}`);
      console.log('Custom purchase tracked:', success);
    } catch (error) {
      setLabel4(`Custom purchase error: ${error}`);
      console.log('Error tracking custom purchase:', error);
    }
  }

  async function fetchUnreadMessages() {
    try {
      const unreadCount = await Grovs.numberOfUnreadMessages();
      console.log(`Unread messages: ${unreadCount}`);
      setLabel3(`Unread messages: ${unreadCount}`);
    } catch (error) {
      console.log('Error fetching unread messages:', error);
      setLabel3(`Unread messages error: ${error}`);
      if ((error as { code?: string }).code === 'SDK_DISABLED') {
        setSdkEnabled(false);
      }
    }
  }

  const handleTrackEvent = () => {
    Grovs.track('example_event', { source: 'example_app', count: 1 }, ['demo']);
  };

  const handleTrackScreenView = () => {
    Grovs.trackScreenView('ExampleScreen', { origin: 'button' });
  };

  const handleSetGlobalTags = () => {
    Grovs.setGlobalTags(['example-global']);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label1}</Text>
        <TouchableOpacity
          onPress={() => copyText(label1)}
          style={styles.copyButton}
        >
          <Text style={styles.copyText}>📋</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label2}</Text>
        <TouchableOpacity
          onPress={() => copyText(label2)}
          style={styles.copyButton}
        >
          <Text style={styles.copyText}>📋</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label3}</Text>
        <TouchableOpacity
          onPress={() => copyText(label3)}
          style={styles.copyButton}
        >
          <Text style={styles.copyText}>📋</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.labelContainer}>
        <Text style={styles.label}>SDK enabled</Text>
        <Switch value={sdkEnabled} onValueChange={handleToggleSDK} />
      </View>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>Copy link to clipboard</Text>
        <Switch value={copyToClipboard} onValueChange={setCopyToClipboard} />
      </View>
      <View style={{ height: 20 }} />
      <Button title="Generate link" onPress={handleGenerateLinkPress} />
      <View style={{ height: 20 }} />
      <Button
        title="Show notifications"
        onPress={handleShowNotificationsPress}
      />
      <View style={{ height: 20 }} />
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label4}</Text>
      </View>
      <Button title="Log in-app purchase" onPress={handleLogInAppPurchase} />
      <View style={{ height: 10 }} />
      <Button title="Log custom purchase" onPress={handleLogCustomPurchase} />
      <View style={{ height: 20 }} />
      <Button title="Track event" onPress={handleTrackEvent} />
      <View style={{ height: 10 }} />
      <Button title="Track screen view" onPress={handleTrackScreenView} />
      <View style={{ height: 10 }} />
      <Button title="Set global tags" onPress={handleSetGlobalTags} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '90%',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    marginRight: 10,
  },
  copyButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  copyText: {
    fontSize: 18,
  },
});
