import { useRouter } from 'expo-router';
import { View, Text, Button } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to Roomies!</Text>
      <View style={{ marginBottom: 10 }}>
        <Button title="Login" onPress={() => router.push('/login')} />
      </View>
      <View style={{ marginBottom: 10 }}>
        <Button title="Register" onPress={() => router.push('/register')} />
      </View>
    </View>
  );
}