import { Stack } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function RoomLayout() {
  const { session, sessionLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace('/');
    }
  }, [session, sessionLoading]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
