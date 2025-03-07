import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuthContext } from '@/contexts/AuthContext';
import { apiLeaveRoom } from "@/utils/api/apiClient";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export default function SettingsScreen() {
  const { session, signOut } = useAuthContext();
  const router = useRouter();

  const handleLeaveRoom = async () => {
    Alert.alert(
      "Leave Room",
      "Are you sure? All your chores will be deleted.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await apiLeaveRoom(session);
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message
              });
              return;
            }
            router.replace("/room-landing");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleLeaveRoom}>
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
