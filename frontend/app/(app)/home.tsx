import { useSession } from '@/contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { apiGetMessage } from '@/utils/api/apiClient';

export default function HomeScreen() {
  const { session, sessionLoading } = useSession();
  const [backendMessage, setBackendMessage] = useState<string | null>('loading');

  useEffect(() => {
    const fetchMessage = async () => {
      if (!session) return;

      try {
        const greeting = await apiGetMessage(session);
        setBackendMessage(greeting);
      } catch (error) {
        console.error('Error fetching message:', error);
      }
    };

    fetchMessage();
  }, [session]);

  if (sessionLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{backendMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D09E',
  },
});
