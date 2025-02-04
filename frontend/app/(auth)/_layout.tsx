import { useSession } from '@/contexts/AuthContext';
import { useRouter, Stack } from 'expo-router';
import { useEffect } from 'react';

export default function AuthLayout() {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/home');
    }
  }, [session, isLoading]);

  if (isLoading) {
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