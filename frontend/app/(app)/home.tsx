import { useSession } from "@/contexts/AuthContext";
import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import API_URL from "@/utils/api/apiClient";

export default function HomeScreen() {
  const { session, isLoading } = useSession();
  const [backendMessage, setBackendMessage] = useState<string | null>("loading");

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const response = await fetch(`${API_URL}/protected`, {
          headers: {
            Authorization: `Bearer ${session}`,
          },
        });
        const data = await response.json();
        console.log(data.message);
        setBackendMessage(data.message);
      } catch (error) {
        console.error("Error fetching message:", error);
      }
    };

    fetchMessage();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{backendMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00D09E",
  },
});
