import { View, Text, StyleSheet } from "react-native";

export default function ChoresScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Chores!</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00D09E",
  },
});
