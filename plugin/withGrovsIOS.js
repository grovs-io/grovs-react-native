/* eslint-disable no-shadow */
const {
  withInfoPlist,
  withEntitlementsPlist,
  withAppDelegate,
} = require('expo/config-plugins');

function withGrovsURLScheme(config, { scheme }) {
  return withInfoPlist(config, (config) => {
    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    // Remove existing Grovs scheme entry to ensure idempotency
    config.modResults.CFBundleURLTypes =
      config.modResults.CFBundleURLTypes.filter(
        (entry) =>
          !(
            entry.CFBundleURLName === 'Grovs' ||
            entry.CFBundleURLSchemes?.includes(scheme)
          )
      );

    config.modResults.CFBundleURLTypes.push({
      CFBundleURLName: 'Grovs',
      CFBundleTypeRole: 'Editor',
      CFBundleURLSchemes: [scheme],
    });

    return config;
  });
}

function withGrovsAssociatedDomains(config, { associatedDomains }) {
  if (!associatedDomains || associatedDomains.length === 0) {
    return config;
  }

  return withEntitlementsPlist(config, (config) => {
    const existing =
      config.modResults['com.apple.developer.associated-domains'] || [];

    const grovsDomains = associatedDomains.map((d) =>
      d.startsWith('applinks:') ? d : `applinks:${d}`
    );

    // Merge without duplicates
    const merged = [...new Set([...existing, ...grovsDomains])];
    config.modResults['com.apple.developer.associated-domains'] = merged;

    return config;
  });
}

function addGrovsImport(contents) {
  if (contents.includes('import Grovs')) {
    return contents;
  }
  // Add after the last import statement
  const lastImportIndex = contents.lastIndexOf('\nimport ');
  if (lastImportIndex === -1) {
    return `import Grovs\n${contents}`;
  }
  const endOfLine = contents.indexOf('\n', lastImportIndex + 1);
  return (
    contents.slice(0, endOfLine) + '\nimport Grovs' + contents.slice(endOfLine)
  );
}

function addGrovsConfiguration(contents, { apiKey, useTestEnvironment }) {
  if (contents.includes('Grovs.configure')) {
    return contents;
  }

  const configCode = [
    '',
    `    Grovs.configure(APIKey: "${apiKey}", useTestEnvironment: ${useTestEnvironment}, delegate: nil)`,
  ].join('\n');

  // Insert before `return super.application(` in didFinishLaunchingWithOptions
  const returnSuperIndex = contents.indexOf(
    'return super.application(application, didFinishLaunchingWithOptions'
  );
  if (returnSuperIndex !== -1) {
    return (
      contents.slice(0, returnSuperIndex) +
      configCode +
      '\n\n    ' +
      contents.slice(returnSuperIndex)
    );
  }

  return contents;
}

function addGrovsUniversalLinkHandler(contents) {
  if (contents.includes('Grovs.handleAppDelegate(continue:')) {
    return contents;
  }

  const method = `
  override func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return Grovs.handleAppDelegate(continue: userActivity, restorationHandler: restorationHandler)
  }`;

  return insertBeforeClosingBrace(contents, method);
}

function addGrovsURLHandler(contents) {
  if (contents.includes('Grovs.handleAppDelegate(open:')) {
    return contents;
  }

  const method = `
  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return Grovs.handleAppDelegate(open: url, options: options)
  }`;

  return insertBeforeClosingBrace(contents, method);
}

function insertBeforeClosingBrace(contents, code) {
  // Find the last closing brace of the class
  const lastBrace = contents.lastIndexOf('}');
  if (lastBrace === -1) {
    return contents;
  }
  return contents.slice(0, lastBrace) + code + '\n' + contents.slice(lastBrace);
}

function withGrovsAppDelegate(config, props) {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      throw new Error(
        'react-native-grovs-wrapper config plugin requires a Swift AppDelegate. ' +
          'Objective-C AppDelegate is not supported.'
      );
    }

    let contents = config.modResults.contents;
    contents = addGrovsImport(contents);
    contents = addGrovsConfiguration(contents, props);
    contents = addGrovsUniversalLinkHandler(contents);
    contents = addGrovsURLHandler(contents);
    config.modResults.contents = contents;

    return config;
  });
}

function withGrovsIOS(config, props) {
  config = withGrovsURLScheme(config, props);
  config = withGrovsAssociatedDomains(config, props);
  config = withGrovsAppDelegate(config, props);
  return config;
}

module.exports = withGrovsIOS;

// Export helpers for testing
module.exports.addGrovsImport = addGrovsImport;
module.exports.addGrovsConfiguration = addGrovsConfiguration;
module.exports.addGrovsUniversalLinkHandler = addGrovsUniversalLinkHandler;
module.exports.addGrovsURLHandler = addGrovsURLHandler;
