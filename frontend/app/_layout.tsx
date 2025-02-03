import { SessionProvider } from '@/contexts/AuthContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}
