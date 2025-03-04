import React, { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { View, Text, StyleSheet } from "react-native";
import { apiGetRoom } from "@/utils/api/apiClient";

interface RoomData {
  room_id: number | null;
  name: string | null;
  invite_code: string | null;
}

export default function HomeScreen() {
  const { session, sessionLoading } = useAuthContext();
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;

      try {
        const room = await apiGetRoom(session);
        setRoomData(room);
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchData();
  }, [session]);

  if (sessionLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {roomData && roomData.room_id ? (
        <>
          <Text style={styles.title}>Welcome to Room {roomData.name}</Text>
          <Text style={styles.inviteCode}>Invite Code: {roomData.invite_code}</Text>
        </>
      ) : (
        <Text style={styles.noRoom}>You are not in a room yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00D09E",
    marginBottom: 20,
  },
  inviteCode: {
    fontSize: 16,
    color: "#666",
  },
  noRoom: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});
