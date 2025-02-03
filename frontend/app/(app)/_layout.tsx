import { useSession } from "@/contexts/AuthContext";
import { useRouter, Tabs } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AppLayout() {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [session, isLoading]);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#DFF7E2" },
        tabBarActiveTintColor: "#00D09E",
        tabBarInactiveTintColor: "#555",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          tabBarLabel: "Chores",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
