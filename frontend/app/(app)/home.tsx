import { useSession } from "@/contexts/AuthContext";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import { useState } from "react";

export default function HomeScreen() {
  const { sessionLoading } = useSession();
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";
  const roommates = [
    { id: "1", name: "Byron", avatar: defaultAvatar },
    { id: "2", name: "Caolinn", avatar: defaultAvatar },
    { id: "3", name: "Claire", avatar: defaultAvatar },
    { id: "4", name: "Ishita", avatar: defaultAvatar },
    { id: "5", name: "Nik", avatar: defaultAvatar },
    { id: "6", name: "Nira", avatar: defaultAvatar },
  ];
  const joinCode = "78474";

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
            numColumns={2}
            contentContainerStyle={styles.roommateList}
            renderItem={({ item }) => (
              <View style={styles.roommateContainer}>
                <Text style={styles.roommate}>{item.name}</Text>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              </View>
            )}
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
  roommateList: {
    justifyContent: "center",
    alignItems: "center",
  },
  roommateContainer: {
    alignItems: "center",
    margin: 10,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: 100,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginTop: 5,
  },
  roommate: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333", 
    textAlign: "center" 
  }
});
