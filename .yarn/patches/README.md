# React Native 0.77.0 iOS dependency patch

The React Native patch upgrades `fmt` from 11.0.2 to 12.1.0 and updates all
matching iOS podspec dependency pins. It backports the
[upstream Xcode compatibility fix](https://github.com/react/react-native/commit/faeef2b90a56633ad44289b994d31e7ce590b145).

The root `package.json` resolution applies the patch to all workspaces during
`yarn install`. After changing the patch, run `pod update fmt RCT-Folly
--no-repo-update` in both `example/ios` and `example_old_arch/ios`, then build
both examples.

Remove the patch and its resolution when the examples move to a React Native
version that includes the fix. This patch only changes iOS podspecs.
