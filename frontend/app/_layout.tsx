// _layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}