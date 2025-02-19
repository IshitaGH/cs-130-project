import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSession } from '@/contexts/AuthContext';
import { apiLeaveRoom } from "@/utils/api/apiClient";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const { session, signOut } = useSession();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={async () => { apiLeaveRoom(session); router.replace("/room-landing") }}>
        <Text style={styles.buttonText}>Leave Room</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => { signOut() }}>
        <Text style={styles.buttonText}>Sign Out</Text>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#00D09E",
  },
  button: {
    width: 200,
    paddingVertical: 10,
    backgroundColor: "#00D09E",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
