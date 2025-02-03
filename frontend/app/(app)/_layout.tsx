import { useSession } from '@/contexts/AuthContext';
import { useRouter, Slot } from 'expo-router';
import { useEffect } from 'react';
import { View, Text } from 'react-native';

export default function AppLayout() {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login'); // Redirect to login if not authenticated
    }
  }, [session, isLoading]);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return <Slot />;
}