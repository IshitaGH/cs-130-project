import { SessionProvider } from '@/src/AuthContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Slot /> {/* Ensures all pages get wrapped inside the provider */}
    </SessionProvider>
  );
}