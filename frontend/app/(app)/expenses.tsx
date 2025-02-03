import { View, Text, StyleSheet } from "react-native";

export default function ExpensesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Expenses!</Text>
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
});
