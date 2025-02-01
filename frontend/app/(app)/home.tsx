import { useSession } from '@/src/AuthContext';
import { useRouter } from 'expo-router';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useEffect } from 'react';

export default function HomeScreen() {
  const { session, signOut, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace('/login'); // Redirect to login if not authenticated
    }
  }, [session, isLoading]);

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
      <Text style={styles.subtitle}>You are logged in.</Text>
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
