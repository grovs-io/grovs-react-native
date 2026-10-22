import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import { startLogging } from './src/actions/startup';

startLogging();

AppRegistry.registerComponent(appName, () => App);
