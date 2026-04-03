// Mock for expo/config-plugins used in plugin tests.
// The plugin tests only test string transformation helpers,
// not the actual Expo mod pipeline.

function passthrough(config) {
  return config;
}

module.exports = {
  withInfoPlist: passthrough,
  withEntitlementsPlist: passthrough,
  withAppDelegate: passthrough,
  withAndroidManifest: passthrough,
  withMainApplication: passthrough,
  withMainActivity: passthrough,
  createRunOncePlugin: (fn) => fn,
};
