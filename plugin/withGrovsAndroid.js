/* eslint-disable no-shadow */
const {
  withAndroidManifest,
  withMainApplication,
  withMainActivity,
} = require('expo/config-plugins');

function withGrovsManifest(config, { scheme, associatedDomains }) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];
    if (!application) return config;

    const mainActivity = application.activity?.find(
      (a) =>
        a.$?.['android:name'] === '.MainActivity' ||
        a.$?.['android:name']?.endsWith('.MainActivity')
    );
    if (!mainActivity) return config;

    if (!mainActivity['intent-filter']) {
      mainActivity['intent-filter'] = [];
    }

    // Remove existing Grovs intent filters for idempotency
    mainActivity['intent-filter'] = mainActivity['intent-filter'].filter(
      (f) => {
        const data = f.data?.[0]?.$;
        if (!data) return true;
        // Remove scheme-based Grovs filter
        if (
          data['android:scheme'] === scheme &&
          data['android:host'] === 'open'
        ) {
          return false;
        }
        // Remove associated domain filters
        if (
          associatedDomains?.some(
            (d) =>
              data['android:host'] === d && data['android:scheme'] === 'https'
          )
        ) {
          return false;
        }
        return true;
      }
    );

    // Add custom scheme intent filter
    mainActivity['intent-filter'].push({
      action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
        { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
      ],
      data: [{ $: { 'android:scheme': scheme, 'android:host': 'open' } }],
    });

    // Add associated domain intent filters (universal links)
    if (associatedDomains) {
      for (const domain of associatedDomains) {
        mainActivity['intent-filter'].push({
          $: { 'android:autoVerify': 'true' },
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          category: [
            { $: { 'android:name': 'android.intent.category.DEFAULT' } },
            { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
          ],
          data: [{ $: { 'android:scheme': 'https', 'android:host': domain } }],
        });
      }
    }

    return config;
  });
}

function addGrovsImportToMainApplication(contents) {
  if (contents.includes('import io.grovs.Grovs')) {
    return contents;
  }
  // Add after the last import statement
  const lastImportIndex = contents.lastIndexOf('\nimport ');
  if (lastImportIndex === -1) {
    return `import io.grovs.Grovs\n${contents}`;
  }
  const endOfLine = contents.indexOf('\n', lastImportIndex + 1);
  return (
    contents.slice(0, endOfLine) +
    '\nimport io.grovs.Grovs' +
    contents.slice(endOfLine)
  );
}

function addGrovsConfigure(contents, { apiKey, useTestEnvironment, baseURL }) {
  if (contents.includes('Grovs.configure')) {
    return contents;
  }

  const configCode = baseURL
    ? `    Grovs.configure(this, "${apiKey}", useTestEnvironment = ${useTestEnvironment}, baseURL = "${baseURL}")\n`
    : `    Grovs.configure(this, "${apiKey}", useTestEnvironment = ${useTestEnvironment})\n`;

  // Insert after super.onCreate()
  const superOnCreate = contents.indexOf('super.onCreate()');
  if (superOnCreate === -1) {
    return contents;
  }
  const endOfLine = contents.indexOf('\n', superOnCreate);
  return (
    contents.slice(0, endOfLine + 1) +
    '\n' +
    configCode +
    contents.slice(endOfLine + 1)
  );
}

function withGrovsMainApplication(config, props) {
  return withMainApplication(config, (config) => {
    if (config.modResults.language !== 'kotlin') {
      throw new Error(
        'react-native-grovs-wrapper config plugin requires a Kotlin MainApplication. ' +
          'Java MainApplication is not supported.'
      );
    }

    let contents = config.modResults.contents;
    contents = addGrovsImportToMainApplication(contents);
    contents = addGrovsConfigure(contents, props);
    config.modResults.contents = contents;

    return config;
  });
}

function addGrovsImportToMainActivity(contents) {
  if (contents.includes('import io.grovs.Grovs')) {
    return contents;
  }
  const lastImportIndex = contents.lastIndexOf('\nimport ');
  if (lastImportIndex === -1) {
    return `import io.grovs.Grovs\n${contents}`;
  }
  const endOfLine = contents.indexOf('\n', lastImportIndex + 1);
  return (
    contents.slice(0, endOfLine) +
    '\nimport io.grovs.Grovs' +
    contents.slice(endOfLine)
  );
}

function addGrovsIntentImport(contents) {
  if (contents.includes('import android.content.Intent')) {
    return contents;
  }
  const lastImportIndex = contents.lastIndexOf('\nimport ');
  if (lastImportIndex === -1) {
    return `import android.content.Intent\n${contents}`;
  }
  const endOfLine = contents.indexOf('\n', lastImportIndex + 1);
  return (
    contents.slice(0, endOfLine) +
    '\nimport android.content.Intent' +
    contents.slice(endOfLine)
  );
}

function addGrovsOnStart(contents) {
  if (contents.includes('Grovs.onStart')) {
    return contents;
  }

  const method = `
  override fun onStart() {
    super.onStart()
    Grovs.onStart(launcherActivity = this)
  }`;

  return insertBeforeClosingBrace(contents, method);
}

function addGrovsOnNewIntent(contents) {
  if (contents.includes('Grovs.onNewIntent')) {
    return contents;
  }

  const method = `
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    Grovs.onNewIntent(intent, launcherActivity = this)
  }`;

  return insertBeforeClosingBrace(contents, method);
}

function insertBeforeClosingBrace(contents, code) {
  const lastBrace = contents.lastIndexOf('}');
  if (lastBrace === -1) {
    return contents;
  }
  return contents.slice(0, lastBrace) + code + '\n' + contents.slice(lastBrace);
}

function withGrovsMainActivity(config) {
  return withMainActivity(config, (config) => {
    if (config.modResults.language !== 'kotlin') {
      throw new Error(
        'react-native-grovs-wrapper config plugin requires a Kotlin MainActivity. ' +
          'Java MainActivity is not supported.'
      );
    }

    let contents = config.modResults.contents;
    contents = addGrovsImportToMainActivity(contents);
    contents = addGrovsIntentImport(contents);
    contents = addGrovsOnStart(contents);
    contents = addGrovsOnNewIntent(contents);
    config.modResults.contents = contents;

    return config;
  });
}

function withGrovsAndroid(config, props) {
  config = withGrovsManifest(config, props);
  config = withGrovsMainApplication(config, props);
  config = withGrovsMainActivity(config);
  return config;
}

module.exports = withGrovsAndroid;

// Export helpers for testing
module.exports.addGrovsImportToMainApplication =
  addGrovsImportToMainApplication;
module.exports.addGrovsConfigure = addGrovsConfigure;
module.exports.addGrovsImportToMainActivity = addGrovsImportToMainActivity;
module.exports.addGrovsIntentImport = addGrovsIntentImport;
module.exports.addGrovsOnStart = addGrovsOnStart;
module.exports.addGrovsOnNewIntent = addGrovsOnNewIntent;
