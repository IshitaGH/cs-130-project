import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useAuthContext } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Expense period closed by Ishita" },
    { id: 2, message: "Nik finished task: clean oven" },
    { id: 3, message: "Nira bought: new pan" },
    { id: 4, message: "Welcome to Roomies!!!" },
  ]);
  const router = useRouter();
  const { session } = useAuthContext();

  useEffect(() => {
    // Placeholder for API call
    // This will be replaced when the API is connected
  }, [session]);

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.notificationItem}>
            <Ionicons name="notifications" size={20} color="#00D09E" style={styles.icon} />
            <Text style={styles.notificationText}>{item.message}</Text>
          </View>
        )}
      />
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={20} color="#FFF" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingTop: 50,
    },
    title: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#00D09E",
      marginBottom: 20,
    },
    notificationItem: {
      flexDirection: "row",
      alignItems: "center",
      width: "90%",
      padding: 15,
      borderRadius: 10,
      backgroundColor: "#F0F0F0",
      marginBottom: 10,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    icon: {
      marginRight: 10,
    },
    notificationText: {
      fontSize: 16,
      color: "#333",
    },
    backButton: {
      position: "absolute",
      bottom: 30,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#00D09E",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 25,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    backButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
    },
  });
  