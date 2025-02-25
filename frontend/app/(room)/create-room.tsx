import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { apiCreateRoom } from "@/utils/api/apiClient";
import { useAuthContext } from "@/contexts/AuthContext";

export default function CreateRoomScreen() {
  const [roomName, setRoomName] = useState("");
  const router = useRouter();
  const { session } = useAuthContext();

  const handleCreateRoom = async () => {
    let data;
    try {
      data = await apiCreateRoom(session, roomName);
    } catch (error) {
      console.error(error);
      return;
    }
    router.replace("/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Room</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Room Name"
        value={roomName}
        onChangeText={setRoomName}
      />
      <TouchableOpacity style={styles.button} onPress={handleCreateRoom}>
        <Text style={styles.buttonText}>Create Room</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back to Room Manager</Text>
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
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00D09E",
    marginBottom: 40,
  },
  input: {
    width: 200,
    height: 50,
    borderWidth: 1,
    borderColor: "#00D09E",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#FFFFFF",
    fontSize: 16,
    color: "#333",
  },
  button: {
    width: 200,
    paddingVertical: 12,
    backgroundColor: "#00D09E",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 30,
  },
  backButtonText: {
    color: "#00D09E",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
