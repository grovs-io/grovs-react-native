/* eslint-disable react-native/no-inline-styles */
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Button,
  Clipboard,
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

  const handleGenerateLinkPress = () => {
    generateLink();
  };

  const handleShowNotificationsPress = () => {
    Grovs.displayMessages();
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    console.log(`Copied: "${text}"`);
  };

  async function generateLink() {
    try {
      const link = await Grovs.generateLink(
        'Test link',
        'Test subtitle',
        undefined,
        { age: 25, city: 'New York' },
        undefined,
        {
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
        false,
        false,
        {
          utm_medium: 'social',
          utm_source: 'social_network',
          utm_campaign: 'react_native_integration',
        }
      );
      console.log(`Generated link: ${link}`);
      setLabel2(`Generated link: ${link}`);
    } catch (error) {
      console.log('Error generating link:', error);
    }
  }

  async function fetchUnreadMessages() {
    try {
      const unreadCount = await Grovs.numberOfUnreadMessages();
      console.log(`Unread messages: ${unreadCount}`);
      setLabel3(`Unread messages: ${unreadCount}`);
    } catch (error) {
      console.log('Error fetching unread messages:', error);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label1}</Text>
        <TouchableOpacity
          onPress={() => copyToClipboard(label1)}
          style={styles.copyButton}
        >
          <Text style={styles.copyText}>📋</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label2}</Text>
        <TouchableOpacity
          onPress={() => copyToClipboard(label2)}
          style={styles.copyButton}
        >
          <Text style={styles.copyText}>📋</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 20 }} />
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label3}</Text>
        <TouchableOpacity
          onPress={() => copyToClipboard(label3)}
          style={styles.copyButton}
        >
          <Text style={styles.copyText}>📋</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 20 }} />
      <Button title="Generate link" onPress={handleGenerateLinkPress} />
      <View style={{ height: 20 }} />
      <Button
        title="Show notifications"
        onPress={handleShowNotificationsPress}
      />
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
