import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

export default function IndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image source={require("@/assets/images/icon.png")} style={styles.logo} testID="app-logo"/>

      <Text style={styles.title}>Roomies</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DFF7E2",
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
});
