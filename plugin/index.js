const { createRunOncePlugin } = require('expo/config-plugins');
const withGrovsIOS = require('./withGrovsIOS');
const withGrovsAndroid = require('./withGrovsAndroid');

const pkg = require('../package.json');

/**
 * Expo Config Plugin for react-native-grovs-wrapper.
 *
 * Configures native iOS and Android projects for the Grovs SDK.
 *
 * @param {import('expo/config-plugins').ExpoConfig} config
 * @param {Object} props
 * @param {string} props.apiKey - Grovs API key
 * @param {string} props.scheme - Custom URL scheme (e.g., "grovst5abed1b0fdf8")
 * @param {boolean} [props.useTestEnvironment=false] - Use test environment
 * @param {string|null} [props.baseURL=null] - Optional custom base URL for the Grovs SDK
 * @param {string[]} [props.associatedDomains] - Universal link domains (e.g., ["grovdc41.sqd.link"])
 * @param {string[]} [props.clipboardDomains=[]] - Domains eligible for clipboard attribution
 */
function withGrovs(config, props) {
  if (!props?.apiKey) {
    throw new Error(
      'react-native-grovs-wrapper plugin requires an "apiKey" property.'
    );
  }
  if (!props?.scheme) {
    throw new Error(
      'react-native-grovs-wrapper plugin requires a "scheme" property.'
    );
  }

  if (
    props.clipboardDomains !== undefined &&
    (!Array.isArray(props.clipboardDomains) ||
      props.clipboardDomains.some((domain) => typeof domain !== 'string'))
  ) {
    throw new Error(
      'react-native-grovs-wrapper plugin "clipboardDomains" must be an array of strings.'
    );
  }

  const pluginProps = {
    apiKey: props.apiKey,
    scheme: props.scheme,
    useTestEnvironment: props.useTestEnvironment ?? false,
    baseURL: props.baseURL ?? null,
    associatedDomains: props.associatedDomains ?? [],
    clipboardDomains: props.clipboardDomains ?? [],
  };

  config = withGrovsIOS(config, pluginProps);
  config = withGrovsAndroid(config, pluginProps);

  return config;
}

module.exports = createRunOncePlugin(withGrovs, pkg.name, pkg.version);
