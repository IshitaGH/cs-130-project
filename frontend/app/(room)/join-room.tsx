import { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useSession } from "@/contexts/AuthContext";
import { apiJoinRoom } from "@/utils/api/apiClient";
import Toast from "react-native-toast-message";

export default function JoinRoomScreen() {
  const [inviteCode, setInviteCode] = useState("");
  const router = useRouter();
  const { session } = useSession();

  const handleJoinRoom = async () => {
    try {
      await apiJoinRoom(session, inviteCode);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Joining Room',
        text2: error.message,
      });
      return;
    }
    console.log("Room joined successfully");
    router.replace("/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Room</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Invite Code"
        value={inviteCode}
        onChangeText={setInviteCode}
      />
      <TouchableOpacity style={styles.button} onPress={handleJoinRoom}>
        <Text style={styles.buttonText}>Join Room</Text>
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
