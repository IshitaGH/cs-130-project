import { Stack } from 'expo-router';
import { useSession } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function RoomLayout() {
  const { session, sessionLoading, signInLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !session && !signInLoading) {
      router.replace('/');
    }
  }, [session, sessionLoading, signInLoading]);

  if (sessionLoading || signInLoading) {
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
