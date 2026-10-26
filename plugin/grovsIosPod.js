const pkg = require('../package.json');

const GROVS_IOS_REPO = 'https://github.com/grovs-io/grovs-iOS.git';

function readGrovsIosSdkVersion() {
  const version = pkg.grovsIosSdkVersion;
  if (!version) {
    throw new Error('Missing grovsIosSdkVersion in package.json.');
  }
  return version;
}

// CocoaPods trunk no longer accepts new pods, so the Grovs pods come from the SDK's git tag.
function grovsPodLine(name, version) {
  return `pod '${name}', :git => '${GROVS_IOS_REPO}', :tag => '${version}'`;
}

module.exports = { readGrovsIosSdkVersion, grovsPodLine };
