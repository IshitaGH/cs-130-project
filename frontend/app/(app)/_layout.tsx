import React, { useState, useEffect } from 'react';
import { useAuthContext } from "@/contexts/AuthContext";
import { useRouter, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from 'react-native';
import { NotificationBadge } from '@/components/NotificationBadge';
import { apiGetNotifications } from '@/utils/api/apiClient';

// Define the notification interface
interface Notification {
  id: number;
  notification_recipient: number;
  notification_sender: number;
  notification_time: string;
  title?: string;
  description?: string;
}

export default function AppLayout() {
  const { session, sessionLoading, userId } = useAuthContext();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  // Effect to redirect if not logged in
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/");
    }
  }, [session, sessionLoading]);

  // Effect to fetch notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session || !userId) return;
      
      try {
        const data = await apiGetNotifications(session);
        
        // Only count notifications for the current user
        const userNotifications = data.filter(
          (notification: Notification) => notification.notification_recipient === userId
        );
        
        setNotificationCount(userNotifications.length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    // Fetch initially
    fetchNotifications();
    
    // Set up a refresh interval (every 30 seconds)
    const intervalId = setInterval(fetchNotifications, 30000);
    
    // Clean up
    return () => clearInterval(intervalId);
  }, [session, userId]);

  // Create a reusable header right component with notification badge
  const headerRightComponent = () => (
    <TouchableOpacity
      onPress={() => router.push("/(reminder)/reminder")}
      style={{ marginRight: 15 }}
    >
      <View>
        <Ionicons name="notifications" size={24} color="#555" />
        <NotificationBadge count={notificationCount} showCount={true} />
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
          headerRight: headerRightComponent,
        }}
      />
    </Tabs>
  );
}