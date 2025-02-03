import { useSession } from '@/contexts/AuthContext';
import { useRouter, Slot } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';

export default function AuthLayout() {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/home'); // Redirect logged-in users to home
    }
  }, [session, isLoading]);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return <Slot />;
}