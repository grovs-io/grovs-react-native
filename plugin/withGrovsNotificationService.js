/* eslint-disable no-shadow */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { withXcodeProject, withDangerousMod } = require('expo/config-plugins');

const NAME = 'GrovsNotificationService';
const SOURCE_FILE = 'NotificationService.swift';
const INFO_PLIST = 'Info.plist';
const TEMPLATES_DIR = path.join(__dirname, 'templates', NAME);
const EMBED_PHASE = 'Embed Foundation Extensions';
const APP_PRODUCT_TYPE = 'com.apple.product-type.application';
// CocoaPods needs the host app and its extension to share the same linkage.
const PODFILE_BLOCK = [
  `target '${NAME}' do`,
  "  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']",
  "  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']",
  `  pod '${NAME}', '~> 3.1'`,
  'end',
].join('\n');

function unquote(value) {
  return typeof value === 'string' ? value.replace(/^"(.*)"$/, '$1') : value;
}

function quote(value) {
  const text = String(value);
  return /^[A-Za-z0-9_./]+$/.test(text) ? text : JSON.stringify(text);
}

function extensionBundleIdentifier(bundleIdentifier) {
  return `${bundleIdentifier}.${NAME}`;
}

function isComment(key) {
  return key.endsWith('_comment');
}

function findNativeTarget(project, predicate) {
  const section = project.pbxNativeTargetSection();
  const uuid = Object.keys(section).find(
    (key) => !isComment(key) && predicate(section[key])
  );
  return uuid ? { uuid, target: section[uuid] } : null;
}

function buildConfigurations(project, configurationListUuid) {
  const list = project.pbxXCConfigurationList()[configurationListUuid];
  const configs = project.pbxXCBuildConfigurationSection();
  return list.buildConfigurations.map(({ value }) => configs[value]);
}

function getAppTargetBuildSettings(project) {
  const app = findNativeTarget(
    project,
    (t) => unquote(t.productType) === APP_PRODUCT_TYPE
  );
  if (!app) {
    throw new Error(
      'react-native-grovs-wrapper plugin could not find the iOS app target.'
    );
  }
  const { firstProject } = project.getFirstProject();
  const scopes = [
    buildConfigurations(project, app.target.buildConfigurationList),
    buildConfigurations(project, firstProject.buildConfigurationList),
  ];
  const read = (key) => {
    for (const configs of scopes) {
      const found = configs.find((c) => c.buildSettings[key] !== undefined);
      if (found) return unquote(found.buildSettings[key]);
    }
    return undefined;
  };
  return {
    deploymentTarget: read('IPHONEOS_DEPLOYMENT_TARGET'),
    swiftVersion: read('SWIFT_VERSION'),
  };
}

function ensureSection(project, name) {
  const objects = project.hash.project.objects;
  if (!objects[name]) objects[name] = {};
}

function renameEmbedPhase(project, appTarget, productComment) {
  const phases = project.hash.project.objects.PBXCopyFilesBuildPhase;
  const ref = appTarget.buildPhases.find(({ value }) =>
    phases[value]?.files.some(({ comment }) =>
      comment.startsWith(productComment)
    )
  );
  if (!ref) return;
  phases[ref.value].name = quote(EMBED_PHASE);
  phases[`${ref.value}_comment`] = EMBED_PHASE;
  ref.comment = EMBED_PHASE;
}

// The xcode package writes missing fields as the literal `undefined`.
function tidyFileReferences(project, uuids) {
  const refs = project.pbxFileReferenceSection();
  for (const uuid of uuids) {
    for (const [key, value] of Object.entries(refs[uuid])) {
      if (value === undefined) delete refs[uuid][key];
    }
  }
}

function removeBuildFilesFor(project, children, fileName) {
  const child = children.find(({ comment }) => comment === fileName);
  const buildFiles = project.pbxBuildFileSection();
  for (const key of Object.keys(buildFiles)) {
    if (!isComment(key) && buildFiles[key].fileRef === child?.value) {
      delete buildFiles[key];
      delete buildFiles[`${key}_comment`];
    }
  }
}

// Prebuild regenerates the project, so ids must not change between runs.
function withStableUuids(project, create) {
  const generateUuid = project.generateUuid;
  let counter = 0;
  project.generateUuid = function () {
    const taken = new Set(this.allUuids());
    let id;
    do {
      id = crypto
        .createHash('sha1')
        .update(`${NAME}:${counter++}`)
        .digest('hex')
        .slice(0, 24)
        .toUpperCase();
    } while (taken.has(id));
    return id;
  };
  try {
    return create();
  } finally {
    project.generateUuid = generateUuid;
  }
}

function createTarget(project, bundleIdentifier) {
  const first = project.getFirstTarget();
  if (unquote(first.firstTarget.productType) !== APP_PRODUCT_TYPE) {
    throw new Error(
      'react-native-grovs-wrapper plugin expects the app to be the first iOS target.'
    );
  }

  ensureSection(project, 'PBXTargetDependency');
  ensureSection(project, 'PBXContainerItemProxy');

  const group = project.addPbxGroup([SOURCE_FILE, INFO_PLIST], NAME, NAME);
  const { mainGroup } = project.getFirstProject().firstProject;
  project.addToPbxGroup(group.uuid, mainGroup);

  const target = project.addTarget(
    NAME,
    'app_extension',
    NAME,
    extensionBundleIdentifier(bundleIdentifier)
  );
  const sources = project.addBuildPhase(
    [SOURCE_FILE],
    'PBXSourcesBuildPhase',
    'Sources',
    target.uuid
  ).buildPhase;
  sources.files.forEach((file) => (file.comment = `${SOURCE_FILE} in Sources`));
  project.addBuildPhase(
    [],
    'PBXFrameworksBuildPhase',
    'Frameworks',
    target.uuid
  );
  project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);

  renameEmbedPhase(project, first.firstTarget, `${NAME}.appex`);
  tidyFileReferences(project, [
    ...group.pbxGroup.children.map(({ value }) => value),
    target.pbxNativeTarget.productReference,
  ]);
  removeBuildFilesFor(project, group.pbxGroup.children, INFO_PLIST);
  return target.pbxNativeTarget;
}

function addGrovsNotificationServiceTarget(
  project,
  {
    bundleIdentifier,
    appleTeamId,
    deploymentTarget,
    swiftVersion,
    marketingVersion = '1.0.0',
    buildNumber = '1',
  }
) {
  const existing = findNativeTarget(project, (t) => unquote(t.name) === NAME);
  const target = existing
    ? existing.target
    : withStableUuids(project, () => createTarget(project, bundleIdentifier));

  const settings = {
    INFOPLIST_FILE: `${NAME}/${INFO_PLIST}`,
    PRODUCT_NAME: '$(TARGET_NAME)',
    // The target name is also the pod module name it imports.
    PRODUCT_MODULE_NAME: 'NotificationServiceExtension',
    PRODUCT_BUNDLE_IDENTIFIER: extensionBundleIdentifier(bundleIdentifier),
    IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
    SWIFT_VERSION: swiftVersion,
    TARGETED_DEVICE_FAMILY: '1,2',
    CODE_SIGN_STYLE: 'Automatic',
    MARKETING_VERSION: marketingVersion,
    CURRENT_PROJECT_VERSION: buildNumber,
    DEVELOPMENT_TEAM: appleTeamId,
  };
  for (const config of buildConfigurations(
    project,
    target.buildConfigurationList
  )) {
    for (const [key, value] of Object.entries(settings)) {
      if (value === undefined || value === null) {
        delete config.buildSettings[key];
      } else {
        config.buildSettings[key] = quote(value);
      }
    }
  }
  return project;
}

function addGrovsNotificationServicePod(podfile) {
  if (podfile.includes(`target '${NAME}' do`)) {
    return podfile;
  }
  const separator = podfile.endsWith('\n') ? '\n' : '\n\n';
  return `${podfile}${separator}${PODFILE_BLOCK}\n`;
}

function addGrovsEasAppExtension(config, bundleIdentifier) {
  const extra = config.extra ?? {};
  const eas = extra.eas ?? {};
  const build = eas.build ?? {};
  const experimental = build.experimental ?? {};
  const ios = experimental.ios ?? {};
  const appExtensions = ios.appExtensions ?? [];
  if (appExtensions.some((entry) => entry.targetName === NAME)) {
    return config;
  }
  return {
    ...config,
    extra: {
      ...extra,
      eas: {
        ...eas,
        build: {
          ...build,
          experimental: {
            ...experimental,
            ios: {
              ...ios,
              appExtensions: [
                ...appExtensions,
                {
                  targetName: NAME,
                  bundleIdentifier: extensionBundleIdentifier(bundleIdentifier),
                  entitlements: {},
                },
              ],
            },
          },
        },
      },
    },
  };
}

function withGrovsNotificationServiceFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosRoot = config.modRequest.platformProjectRoot;
      const targetDir = path.join(iosRoot, NAME);
      fs.mkdirSync(targetDir, { recursive: true });
      for (const file of [SOURCE_FILE, INFO_PLIST]) {
        fs.copyFileSync(
          path.join(TEMPLATES_DIR, file),
          path.join(targetDir, file)
        );
      }

      const podfilePath = path.join(iosRoot, 'Podfile');
      const podfile = fs.readFileSync(podfilePath, 'utf8');
      const updated = addGrovsNotificationServicePod(podfile);
      if (updated !== podfile) {
        fs.writeFileSync(podfilePath, updated, 'utf8');
      }
      return config;
    },
  ]);
}

function withGrovsNotificationServiceTarget(config, { appleTeamId }) {
  return withXcodeProject(config, (config) => {
    const bundleIdentifier = config.ios.bundleIdentifier;
    addGrovsNotificationServiceTarget(config.modResults, {
      bundleIdentifier,
      appleTeamId,
      ...getAppTargetBuildSettings(config.modResults),
      marketingVersion: config.version,
      buildNumber: config.ios.buildNumber,
    });
    return config;
  });
}

function withGrovsNotificationService(config, props) {
  const bundleIdentifier = config.ios?.bundleIdentifier;
  if (!bundleIdentifier) {
    throw new Error(
      'react-native-grovs-wrapper plugin "iosRichPush" requires "ios.bundleIdentifier".'
    );
  }
  config = addGrovsEasAppExtension(config, bundleIdentifier);
  config = withGrovsNotificationServiceFiles(config);
  config = withGrovsNotificationServiceTarget(config, props);
  return config;
}

module.exports = withGrovsNotificationService;

// Export helpers for testing
module.exports.addGrovsNotificationServicePod = addGrovsNotificationServicePod;
module.exports.addGrovsNotificationServiceTarget =
  addGrovsNotificationServiceTarget;
module.exports.addGrovsEasAppExtension = addGrovsEasAppExtension;
module.exports.getAppTargetBuildSettings = getAppTargetBuildSettings;
