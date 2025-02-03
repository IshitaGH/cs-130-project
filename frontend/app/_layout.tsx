import { SessionProvider } from '@/contexts/AuthContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          headerShown: false, // Hide headers globally; you can enable them on specific screens if needed
        }}
      />
    </SessionProvider>
  );
}
