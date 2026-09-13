// Mock for expo/config-plugins used in plugin tests.
// Mod callbacks are captured so tests can run native file transformations.

function passthrough(config) {
  return config;
}

module.exports = {
  withInfoPlist: passthrough,
  withEntitlementsPlist: passthrough,
  withAppDelegate: passthrough,
  withAndroidManifest: passthrough,
  withMainApplication: jest.fn(passthrough),
  withMainActivity: passthrough,
  withAppBuildGradle: jest.fn(passthrough),
  createRunOncePlugin: (fn) => fn,
};
