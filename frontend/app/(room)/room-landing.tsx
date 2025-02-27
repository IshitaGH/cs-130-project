import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useAuthContext } from "@/contexts/AuthContext";

export default function RoomLandingScreen() {
  const router = useRouter();
  const { signOut } = useAuthContext();

  return (
    <View style={styles.container}>
      <Image source={require("@/assets/images/icon.png")} style={styles.logo} />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/join-room")}
      >
        <Text style={styles.buttonText}>Join Room</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/create-room")}
      >
        <Text style={styles.buttonText}>Create Room</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => signOut()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Sign Out</Text>
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
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00D09E",
    marginBottom: 40,
  },
  button: {
    width: 200,
    paddingVertical: 12,
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
  backButton: {
    marginTop: 10,
  },
  backButtonText: {
    color: "#00D09E",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
