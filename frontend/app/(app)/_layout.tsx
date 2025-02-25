import { useSession } from '@/contexts/AuthContext';
import { useRouter, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, TouchableOpacity } from 'react-native';

export default function AppLayout() {
  const { session, sessionLoading, signInLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !session && !signInLoading) {
      router.replace('/');
    }
  }, [session, sessionLoading, signInLoading]);

  if (sessionLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#ffffff' },
        tabBarActiveTintColor: '#00D09E',
        tabBarInactiveTintColor: '#555',
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="list" color={color} size={size} />,
          title: 'Chores',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                /* router.push(/some-chore-manager-page) */
              }}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#555" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" color={color} size={size} />,
          title: 'Expenses',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}
