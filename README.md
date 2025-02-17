# Grovs React-native Wrapper

[Grovs](https://grovs.io) is a powerful SDK that enables deep linking and universal linking within your React native applications. This document serves as a guide to integrate and utilize Grovs seamlessly within your project.

<br />

## Installation

## Installation

### React

Add the Grovs react-native wrapper as a `package.json` depedency.

**yarn**
```sh
yarn add react-native-grovs-wrapper
```

**npm**
```sh
npm install react-native-grovs-wrapper
```

### Android

Add Grovs Android SDK as a dependency in your `PROJECT_DIR/android/app/build.gradle`

```sh
dependencies {
  implementation 'io.grovs:Grovs:1.0.1'
}
```

### iOS

On iOS the Grovs SDK dependency is added automatically using cocoapods.

## Usage


```js
import { Grovs } from 'react-native-grovs-wrapper';
```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
