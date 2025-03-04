import React from 'react';
import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter, Tabs } from "expo-router";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "react-native";

export default function AppLayout() {
  const { session, sessionLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/");
    }
  }, [session, sessionLoading]);

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
        }}
      />
      <Tabs.Screen
        name="chores"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
          title: "Chores",
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" color={color} size={size} />
          ),
          title: "Expenses",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
