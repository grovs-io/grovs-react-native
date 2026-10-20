// Mock for expo/config-plugins used in plugin tests.
// Mod callbacks are captured so tests can run native file transformations.

function passthrough(config) {
  return config;
}

module.exports = {
  withInfoPlist: passthrough,
  withEntitlementsPlist: jest.fn(passthrough),
  withAppDelegate: jest.fn(passthrough),
  withAndroidManifest: jest.fn(passthrough),
  withMainApplication: jest.fn(passthrough),
  withMainActivity: passthrough,
  withAppBuildGradle: jest.fn(passthrough),
  withXcodeProject: jest.fn(passthrough),
  withDangerousMod: jest.fn(passthrough),
  createRunOncePlugin: (fn) => fn,
};
