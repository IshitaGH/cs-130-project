import React, { useEffect, useState } from "react";
import { RefreshControl, View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiGetNotifications, apiDeleteNotification, apiUpdateNotification } from "@/utils/api/apiClient";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  id: number;
  title?: string;
  description?: string;
  notification_recipient: number;
  notification_sender: number;
  notification_time: string;
  is_read: boolean;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { session, userId } = useAuthContext();

  // Fetch notifications function that can be reused
  const fetchNotifications = async () => {
    if (!session) return;
    try {
      const data = await apiGetNotifications(session);
      const filteredNotifications = data.filter(
        (notification: Notification) => notification.notification_recipient === userId
      );
      setNotifications(filteredNotifications);
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to fetch notifications" });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [session, userId]);

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNotifications();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to refresh notifications" });
    } finally {
      setRefreshing(false);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await apiDeleteNotification(session, notificationId);
      // Update the local list
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      // Show success message
      Toast.show({ type: "success", text1: "Success", text2: "Notification deleted successfully" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to delete notification" });
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await apiUpdateNotification(session, {
        notification_id: notificationId,
        is_read: true
      });
      // Update the local list
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message || "Failed to mark notification as read" });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#00D09E" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="#00D09E" />
      ) : notifications.length === 0 ? (
        <Text style={styles.noNotifications}>No notifications yet!</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            let formattedDate = "Invalid Date";
            if (item.notification_time) {
              const dateObj = new Date(item.notification_time);
              if (!isNaN(dateObj.getTime())) {
                dateObj.setTime(dateObj.getTime() - (7 * 60 * 60 * 1000)); // Adjust timezone if needed
                formattedDate = dateObj.toLocaleString();
              }
            }
            return (
              <TouchableOpacity 
                style={[styles.notificationItem, item.is_read ? styles.readNotification : null]} 
                onPress={() => !item.is_read && markAsRead(item.id)}
              >
                <View style={styles.notificationIconContainer}>
                  <Ionicons name="notifications" size={24} color="#FFF" />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{item.title || "Notification"}</Text>
                    {!item.is_read && <View style={styles.unreadIndicator} />}
                  </View>
                  <Text style={styles.message}>{item.description || "No message"}</Text>
                  <Text style={styles.timestamp}>{formattedDate}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteNotification(item.id)} style={styles.deleteButton}>
                  <Ionicons name="trash" size={20} color="#FF0000" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#00D09E"]} 
              tintColor="#00D09E" 
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    color: "#00D09E",
    marginLeft: 5,
  },
  noNotifications: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  readNotification: {
    backgroundColor: "#F8F8F8",
    opacity: 0.8,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00D09E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00D09E",
    marginLeft: 5,
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  deleteButton: {
    padding: 10,
  },
});