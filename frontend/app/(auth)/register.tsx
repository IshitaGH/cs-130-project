import { useState } from "react";
import { useSession } from "@/contexts/AuthContext";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { createAccount } = useSession();
  const router = useRouter();

  const handleRegister = async () => {
    try {
      await createAccount(username, password);
      router.replace("/login");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require("@/assets/images/icon.png")} style={styles.logo} />

      <Text style={styles.title}>Register</Text>

      <TextInput
        placeholder="Username"
        onChangeText={setUsername}
        value={username}
        style={styles.input}
        placeholderTextColor="#aaa"
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        style={styles.input}
        placeholderTextColor="#aaa"
      />

      {/* Display the error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back to Welcome</Text>
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
    paddingHorizontal: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#00D09E",
    marginBottom: 30,
  },
  input: {
    width: "100%",
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
    marginBottom: 20,
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
  errorText: {
    color: '#FF4C4C',  
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
});
