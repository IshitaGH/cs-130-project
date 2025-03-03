import { useState, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import Toast from "react-native-toast-message";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const { createAccount } = useAuthContext();
  const router = useRouter();

  const passwordInputRef = useRef<TextInput>(null);
  const lastNameInputRef = useRef<TextInput>(null);
  const usernameInputRef = useRef<TextInput>(null);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'First name and last name are required',
      });
      return;
    }

    if (username.length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Username',
        text2: 'Username must be at least 3 characters long',
      });
      return;
    }

    if (password.length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Password',
        text2: 'Password must be at least 3 characters long',
      });
      return;
    }

    try {
      await createAccount(firstName, lastName, username, password);
      router.replace("/login");
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Creating Account',
        text2: err.message,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Image source={require("@/assets/images/icon.png")} style={styles.logo} />

        <Text style={styles.title}>Register</Text>

        <TextInput
          placeholder="First Name"
          onChangeText={setFirstName}
          value={firstName}
          style={styles.input}
          placeholderTextColor="#aaa"
          onSubmitEditing={() => lastNameInputRef.current?.focus()}
        />

        <TextInput
          ref={lastNameInputRef}
          placeholder="Last Name"
          onChangeText={setLastName}
          value={lastName}
          style={styles.input}
          placeholderTextColor="#aaa"
          onSubmitEditing={() => usernameInputRef.current?.focus()}
        />

        <TextInput
          ref={usernameInputRef}
          placeholder="Username"
          onChangeText={setUsername}
          value={username}
          style={styles.input}
          placeholderTextColor="#aaa"
          onSubmitEditing={() => passwordInputRef.current?.focus()}
        />

        <TextInput
          ref={passwordInputRef}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          style={styles.input}
          placeholderTextColor="#aaa"
          onSubmitEditing={() => {}}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Welcome</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DFF7E2",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
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
    color: "#FF4C4C",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
});
