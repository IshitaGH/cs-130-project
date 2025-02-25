import { useSession } from "@/contexts/AuthContext";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useState } from "react";

export default function HomeScreen() {
  const { sessionLoading } = useSession();
  const roommates = [
    { id: "1", name: "Byron" },
    { id: "2", name: "Caolinn" },
    { id: "3", name: "Claire" },
    {id: "4", name: "Ishita" },
    {id: "5", name: "Nik" },
    {id: "6", name: "Nira" },

  ];
  const joinCode = "8592";

  if (sessionLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Room Code</Text>
          <Text style={styles.joinCode}>{joinCode}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Roommates</Text>
          <FlatList
            data={roommates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Text style={styles.roommate}>{item.name}</Text>}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#FFFFFF", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  card: { 
    backgroundColor: "#DFF7E280", 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 20, 
    alignItems: "center",
    width: "90%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#007F5F", 
    marginBottom: 10 
  },
  joinCode: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#333", 
    backgroundColor: "#E0F7F5", 
    padding: 10, 
    borderRadius: 8, 
    textAlign: "center", 
    width: "100%"
  },
  roommate: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333", 
    padding: 5, 
    textAlign: "center" 
  }
});
