/* eslint-disable no-shadow */
const {
  withAndroidManifest,
  withMainApplication,
  withMainActivity,
  withAppBuildGradle,
} = require('expo/config-plugins');

const fs = require('fs');
const path = require('path');

const GROVS_ANDROID_DEP_MARKER = '// react-native-grovs-wrapper:dep';

function readGrovsSdkCoordinate() {
  const properties = fs.readFileSync(
    path.join(__dirname, '../android/gradle.properties'),
    'utf8'
  );
  const coordinate = properties
    .match(/^[ \t]*GrovsWrapper_grovsSdkCoordinate[ \t]*=([^\r\n]*)/m)?.[1]
    .trim();
  if (!coordinate) {
    throw new Error(
      'Missing GrovsWrapper_grovsSdkCoordinate in android/gradle.properties.'
    );
  }
  return coordinate;
}

function withGrovsAppDependency(config) {
  return withAppBuildGradle(config, (config) => {
    // The app imports the SDK directly, so it needs its own dependency.
    const dependency = `implementation '${readGrovsSdkCoordinate()}' ${GROVS_ANDROID_DEP_MARKER}`;
    const markedDependency =
      /^([ \t]*)implementation[^\r\n]*\/\/ react-native-grovs-wrapper:dep[^\r\n]*$/gm;
    if (markedDependency.test(config.modResults.contents)) {
      config.modResults.contents = config.modResults.contents.replace(
        markedDependency,
        (_, indent) => `${indent}${dependency}`
      );
      return config;
    }
    const depsBlockRegex = /(dependencies\s*\{[\s\S]*?)(\n\s*\})/;
    config.modResults.contents = config.modResults.contents.replace(
      depsBlockRegex,
      (_, block, closingBrace) => `${block}\n    ${dependency}${closingBrace}`
    );
    return config;
  });
}

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

function addGrovsConsentImportToMainApplication(contents) {
  const consentImport = 'import com.grovswrapper.GrovsConsent';
  if (contents.includes(consentImport)) {
    return contents;
  }
  const lastImport = [...contents.matchAll(/^import [^\r\n]+/gm)].pop();
  if (lastImport) {
    const insertAt = lastImport.index + lastImport[0].length;
    return `${contents.slice(0, insertAt)}\n${consentImport}${contents.slice(insertAt)}`;
  }
  const packageLine = contents.match(/^package [^\r\n]+/m);
  if (packageLine) {
    const insertAt = packageLine.index + packageLine[0].length;
    return `${contents.slice(0, insertAt)}\n\n${consentImport}${contents.slice(insertAt)}`;
  }
  return `${consentImport}\n${contents}`;
}

function addGrovsConfigure(
  contents,
  { apiKey, useTestEnvironment, baseURL, clipboardDomains = [] }
) {
  if (contents.includes('Grovs.configure')) {
    return contents;
  }

  // Native tracking sees only MainActivity; JS tracks individual screens.
  const domains = clipboardDomains.length
    ? `listOf(${clipboardDomains.map((domain) => JSON.stringify(domain).replace(/\$/g, '\\$')).join(', ')})`
    : 'null';
  const configCode = `    Grovs.configure(this, "${apiKey}", useTestEnvironment = ${useTestEnvironment}, baseURL = ${baseURL ? `"${baseURL}"` : 'null'}, autoTrackScreenViews = false, clipboardDomains = ${domains}, enabled = GrovsConsent.isEnabled(this))\n`;

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
    if (config.modResults.language !== 'kt') {
      throw new Error(
        'react-native-grovs-wrapper config plugin requires a Kotlin MainApplication. ' +
          'Java MainApplication is not supported.'
      );
    }

    let contents = config.modResults.contents;
    contents = addGrovsImportToMainApplication(contents);
    contents = addGrovsConsentImportToMainApplication(contents);
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
    setIntent(intent)
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
    if (config.modResults.language !== 'kt') {
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
  config = withGrovsAppDependency(config);
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

module.exports.readGrovsSdkCoordinate = readGrovsSdkCoordinate;
module.exports.addGrovsConsentImportToMainApplication =
  addGrovsConsentImportToMainApplication;
