// Entrypoint for the app. Register the root App directly to avoid
// resolution issues in monorepo workspaces where `expo/AppEntry` tries
// to import '../../App' relative to different node_modules paths.
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
