import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../src/db';
import { registerBackgroundTask } from '../src/notifications/background';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
    registerBackgroundTask();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
