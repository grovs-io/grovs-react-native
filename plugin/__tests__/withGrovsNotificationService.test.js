const fs = require('fs');
const os = require('os');
const path = require('path');
const xcode = require('xcode');
const { withXcodeProject, withDangerousMod } = require('expo/config-plugins');
const withGrovsNotificationService = require('../withGrovsNotificationService');
const {
  addGrovsNotificationServicePod,
  addGrovsNotificationServiceTarget,
  addGrovsEasAppExtension,
  getAppTargetBuildSettings,
} = withGrovsNotificationService;

const NAME = 'GrovsNotificationService';
const APP_ID = 'com.example.app';
const FIXTURE = path.join(
  __dirname,
  '../../example/ios/GrovsWrapperExample.xcodeproj/project.pbxproj'
);

function unquote(value) {
  return typeof value === 'string' ? value.replace(/^"(.*)"$/, '$1') : value;
}

function loadProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grovs-nse-'));
  const file = path.join(dir, 'project.pbxproj');
  fs.copyFileSync(FIXTURE, file);
  const project = xcode.project(file);
  project.parseSync();
  return project;
}

function nativeTargets(project) {
  const section = project.pbxNativeTargetSection();
  return Object.keys(section)
    .filter((key) => !key.endsWith('_comment'))
    .map((uuid) => ({ uuid, ...section[uuid] }));
}

function findTarget(project, name) {
  return nativeTargets(project).find((t) => unquote(t.name) === name);
}

function buildSettingsOf(project, target) {
  const lists = project.pbxXCConfigurationList();
  const configs = project.pbxXCBuildConfigurationSection();
  return lists[target.buildConfigurationList].buildConfigurations.map(
    ({ value }) => configs[value].buildSettings
  );
}

function addTarget(project) {
  const { deploymentTarget, swiftVersion } = getAppTargetBuildSettings(project);
  return addGrovsNotificationServiceTarget(project, {
    bundleIdentifier: APP_ID,
    appleTeamId: 'TEAM123',
    deploymentTarget,
    swiftVersion,
  });
}

describe('withGrovsNotificationService - Xcode target', () => {
  it('adds an app extension target named GrovsNotificationService', () => {
    const project = addTarget(loadProject());
    const target = findTarget(project, NAME);
    expect(target).toBeDefined();
    expect(unquote(target.productType)).toBe(
      'com.apple.product-type.app-extension'
    );
  });

  it('sets the extension build settings from the app target', () => {
    const project = loadProject();
    expect(getAppTargetBuildSettings(project)).toEqual({
      deploymentTarget: '15.1',
      swiftVersion: '5.0',
    });
    addTarget(project);
    const settings = buildSettingsOf(project, findTarget(project, NAME));
    expect(settings).toHaveLength(2);
    for (const s of settings) {
      expect(unquote(s.PRODUCT_BUNDLE_IDENTIFIER)).toBe(
        `${APP_ID}.GrovsNotificationService`
      );
      expect(unquote(s.DEVELOPMENT_TEAM)).toBe('TEAM123');
      expect(unquote(s.IPHONEOS_DEPLOYMENT_TARGET)).toBe('15.1');
      expect(unquote(s.SWIFT_VERSION)).toBe('5.0');
      expect(unquote(s.INFOPLIST_FILE)).toBe(
        'GrovsNotificationService/Info.plist'
      );
      // Must differ from the GrovsNotificationService pod module it imports.
      expect(unquote(s.PRODUCT_MODULE_NAME)).toBe(
        'NotificationServiceExtension'
      );
    }
  });

  it('leaves DEVELOPMENT_TEAM unset without an appleTeamId', () => {
    const project = loadProject();
    addGrovsNotificationServiceTarget(project, {
      bundleIdentifier: APP_ID,
      deploymentTarget: '15.1',
      swiftVersion: '5.0',
    });
    for (const s of buildSettingsOf(project, findTarget(project, NAME))) {
      expect(s.DEVELOPMENT_TEAM).toBeUndefined();
    }
  });

  it('embeds the extension in the app target', () => {
    const project = addTarget(loadProject());
    const app = findTarget(project, 'GrovsWrapperExample');
    const copyPhases = project.hash.project.objects.PBXCopyFilesBuildPhase;
    const embed = app.buildPhases
      .map(({ value }) => copyPhases[value])
      .filter(Boolean)
      .find((phase) =>
        phase.files.some(({ comment }) =>
          comment.includes('GrovsNotificationService.appex')
        )
      );
    expect(embed).toBeDefined();
    expect(embed.dstSubfolderSpec).toBe(13);
    expect(app.dependencies).toHaveLength(1);
  });

  it('adds NotificationService.swift to the target sources', () => {
    const project = addTarget(loadProject());
    const target = findTarget(project, NAME);
    const sourcesPhases = project.hash.project.objects.PBXSourcesBuildPhase;
    const sources = target.buildPhases
      .map(({ value }) => sourcesPhases[value])
      .find(Boolean);
    expect(sources.files.map(({ comment }) => comment)).toEqual([
      'NotificationService.swift in Sources',
    ]);
  });

  it('running twice adds one target', () => {
    const project = addTarget(addTarget(loadProject()));
    expect(
      nativeTargets(project).filter((t) => unquote(t.name) === NAME)
    ).toHaveLength(1);
    const app = findTarget(project, 'GrovsWrapperExample');
    expect(app.dependencies).toHaveLength(1);
    const groups = project.hash.project.objects.PBXGroup;
    expect(
      Object.keys(groups).filter((key) => unquote(groups[key].name) === NAME)
    ).toHaveLength(1);
  });

  it('writes the same project on every fresh prebuild', () => {
    expect(addTarget(loadProject()).writeSync()).toBe(
      addTarget(loadProject()).writeSync()
    );
  });

  it('writes a project Xcode can parse again', () => {
    const project = addTarget(loadProject());
    const reparsed = xcode.project(project.filepath);
    fs.writeFileSync(project.filepath, project.writeSync());
    reparsed.parseSync();
    expect(findTarget(reparsed, NAME)).toBeDefined();
  });
});

describe('withGrovsNotificationService - Podfile', () => {
  const PODFILE = "target 'App' do\n  use_expo_modules!\nend\n";
  const BLOCK =
    "target 'GrovsNotificationService' do\n" +
    "  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']\n" +
    "  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']\n" +
    "  pod 'GrovsNotificationService', :git => 'https://github.com/grovs-io/grovs-iOS.git', :tag => '3.1.0'\n" +
    'end';

  it('adds the extension pod target once, from the SDK git tag', () => {
    const result = addGrovsNotificationServicePod(PODFILE, '3.1.0');
    expect(result.startsWith(PODFILE)).toBe(true);
    expect(result).toContain(BLOCK);
  });

  it('is idempotent', () => {
    const once = addGrovsNotificationServicePod(PODFILE, '3.1.0');
    expect(addGrovsNotificationServicePod(once, '3.1.0')).toBe(once);
    expect(once.split(BLOCK)).toHaveLength(2);
  });

  it('moves an existing extension pod to the new tag', () => {
    const old = addGrovsNotificationServicePod(PODFILE, '3.1.0');
    const updated = addGrovsNotificationServicePod(old, '3.2.0');
    expect(updated).toContain(":tag => '3.2.0'");
    expect(updated).not.toContain("'3.1.0'");
    expect(updated.split("pod 'GrovsNotificationService'")).toHaveLength(2);
  });

  it('replaces a pod pinned to a trunk version', () => {
    const trunk = `${PODFILE}\n${BLOCK.replace(
      /pod 'GrovsNotificationService'.*/,
      "pod 'GrovsNotificationService', '~> 3.1'"
    )}\n`;
    expect(addGrovsNotificationServicePod(trunk, '3.1.0')).toContain(BLOCK);
  });
});

describe('withGrovsNotificationService - EAS appExtensions', () => {
  const ENTRY = {
    targetName: NAME,
    bundleIdentifier: `${APP_ID}.GrovsNotificationService`,
    entitlements: {},
  };

  it('adds the extension entry once', () => {
    const config = addGrovsEasAppExtension({}, APP_ID);
    expect(config.extra.eas.build.experimental.ios.appExtensions).toEqual([
      ENTRY,
    ]);
  });

  it('keeps other existing entries and is idempotent', () => {
    const other = {
      targetName: 'Widget',
      bundleIdentifier: 'x',
      entitlements: {},
    };
    const start = {
      extra: {
        foo: 1,
        eas: {
          projectId: 'p',
          build: { experimental: { ios: { appExtensions: [other] } } },
        },
      },
    };
    const config = addGrovsEasAppExtension(
      addGrovsEasAppExtension(start, APP_ID),
      APP_ID
    );
    expect(config.extra.foo).toBe(1);
    expect(config.extra.eas.projectId).toBe('p');
    expect(config.extra.eas.build.experimental.ios.appExtensions).toEqual([
      other,
      ENTRY,
    ]);
  });
});

describe('withGrovsNotificationService - plugin', () => {
  beforeEach(() => jest.clearAllMocks());

  const props = { appleTeamId: 'TEAM123' };
  const config = () => ({ ios: { bundleIdentifier: APP_ID } });

  it('requires an iOS bundle identifier', () => {
    expect(() => withGrovsNotificationService({}, props)).toThrow(
      'ios.bundleIdentifier'
    );
  });

  it('adds the EAS entry and registers the Xcode and file mods', () => {
    const result = withGrovsNotificationService(config(), props);
    expect(result.extra.eas.build.experimental.ios.appExtensions).toHaveLength(
      1
    );
    expect(withXcodeProject).toHaveBeenCalledTimes(1);
    expect(withDangerousMod).toHaveBeenCalledWith(expect.anything(), [
      'ios',
      expect.any(Function),
    ]);
  });

  it('copies the templates and edits the Podfile, idempotently', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'grovs-nse-ios-'));
    fs.writeFileSync(
      path.join(root, 'Podfile'),
      "target 'App' do\nend\n",
      'utf8'
    );
    withGrovsNotificationService(config(), props);
    const [, [, mod]] = withDangerousMod.mock.calls[0];
    const modConfig = { modRequest: { platformProjectRoot: root } };
    await mod(modConfig);
    await mod(modConfig);

    const dir = path.join(root, NAME);
    expect(
      fs.readFileSync(path.join(dir, 'NotificationService.swift'), 'utf8')
    ).toContain('class NotificationService: GrovsNotificationServiceExtension');
    expect(fs.readFileSync(path.join(dir, 'Info.plist'), 'utf8')).toContain(
      'com.apple.usernotifications.service'
    );
    const podfile = fs.readFileSync(path.join(root, 'Podfile'), 'utf8');
    expect(podfile.match(/target 'GrovsNotificationService'/g)).toHaveLength(1);
  });

  it('adds the target through withXcodeProject using the app settings', () => {
    withGrovsNotificationService(config(), props);
    const mod = withXcodeProject.mock.calls[0][1];
    const project = loadProject();
    mod({ ...config(), modResults: project });
    const settings = buildSettingsOf(project, findTarget(project, NAME));
    expect(unquote(settings[0].PRODUCT_BUNDLE_IDENTIFIER)).toBe(
      `${APP_ID}.GrovsNotificationService`
    );
    expect(unquote(settings[0].DEVELOPMENT_TEAM)).toBe('TEAM123');
    expect(unquote(settings[0].SWIFT_VERSION)).toBe('5.0');
  });
});
