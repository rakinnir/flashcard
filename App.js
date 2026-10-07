import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Mainapp from './Mainapp'; // or wherever your main app code is

export default function App() {
  return (
    <SafeAreaProvider>
      <Mainapp />
    </SafeAreaProvider>
  );
}
