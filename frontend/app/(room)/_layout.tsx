import { Stack } from 'expo-router';
import { useSession } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function RoomLayout() {
  const { session, sessionLoading } = useSession();
  const router = useRouter();

  if (sessionLoading) {
    return null;
  }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}