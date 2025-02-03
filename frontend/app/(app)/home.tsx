import { useSession } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import API_URL from '@/config/api'

export default function HomeScreen() {
  const { session, signOut, isLoading } = useSession();
  const router = useRouter();
  const [ backendMessage, setBackendMessage ] = useState<string | null>("loading");

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login'); // Redirect to login if not authenticated
    }
  }, [session, isLoading]);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await fetch(`${API_URL}/protected`, { // TODO: use axios
          headers: {
            'Authorization': `Bearer ${session}`
          }
        });
        const data = await response.json();
        console.log(data.message)
        setBackendMessage(data.message);
      } catch (error) {
        console.error("Error fetching message:", error);
      }
    };

    fetchMessage();
  }, []);

  const handleSignOut = () => {
    signOut();
    router.replace('/'); // Redirect to '/' after signing out
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Roomies!</Text>
      <Text style={styles.subtitle}>{backendMessage}</Text>
      <View style={styles.buttonWrapper}>
        <Button title="Sign Out" onPress={handleSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9', // Light background for consistency
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555', // Subtle gray text for the subtitle
  },
  buttonWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
});
