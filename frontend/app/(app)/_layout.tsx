import React from 'react';
import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter, Tabs } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from 'react-native';
import { NotificationBadge } from '@/components/NotificationBadge';

export default function AppLayout() {
  const { session, sessionLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/");
    }
  }, [session, sessionLoading]);

  // Create a reusable header right component with notification badge
  const headerRightComponent = () => (
    <TouchableOpacity
      onPress={() => router.push("/(reminder)/reminder")}
      style={{ marginRight: 15 }}
    >
      <View>
        <Ionicons name="notifications" size={24} color="#555" />
        <NotificationBadge count={3} showCount={true} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: "#ffffff" },
        tabBarActiveTintColor: "#00D09E",
        tabBarInactiveTintColor: "#555",
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
          title: "Home",
          headerTitle: "",
          headerRight: headerRightComponent,
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
          title: "Chores",
          headerRight: headerRightComponent,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" color={color} size={size} />
          ),
          title: "Expenses",
          headerRight: headerRightComponent,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
          title: "Settings",
          headerTitle: ""
        }}
      />
    </Tabs>
  );
}