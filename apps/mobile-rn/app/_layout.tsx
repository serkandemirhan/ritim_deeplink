import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AutoSyncRuntime from '../src/services/AutoSyncRuntime';
import DeepLinkRuntime from '../src/services/DeepLinkRuntime';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <AutoSyncRuntime />
      <DeepLinkRuntime />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
