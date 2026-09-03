import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// This guarantees that React Native Bridgeless / Bridge mode registers 'main' properly.
registerRootComponent(App);
