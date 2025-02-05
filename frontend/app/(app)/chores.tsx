import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Chore = {
  id: string;
  name: string;
  roomate_responsible: string;
  ends: string;
  autorotate: boolean;
};

const mockActiveChores = [
  { id: "1", name: "Dishes", roomate_responsible: "Byron", ends: "2025-03-01T23:59:59Z", autorotate: true },
  { id: "2", name: "Clean Kitchen", roomate_responsible: "Byron", ends: "2025-04-01T23:59:59Z", autorotate: true },
  { id: "3", name: "Trash", roomate_responsible: "Byron", ends: "2025-03-01T23:59:59", autorotate: true },
  { id: "4", name: "Clean Kitchen", roomate_responsible: "Byron", ends: "2025-04-01T23:59:59Z", autorotate: true },
  { id: "5", name: "Trash", roomate_responsible: "Byron", ends: "2025-03-01T23:59:59", autorotate: true },
  { id: "6", name: "Clean Kitchen", roomate_responsible: "Byron", ends: "2025-04-01T23:59:59Z", autorotate: true },
  { id: "7", name: "Trash", roomate_responsible: "Byron", ends: "2025-03-01T23:59:59", autorotate: true },
];

const currentUser = "Byron";

export default function ChoresScreen() {
  const yourChores = mockActiveChores.filter((chore) => chore.roomate_responsible === currentUser);
  const roommatesChores = mockActiveChores.filter((chore) => chore.roomate_responsible !== currentUser);

  const renderChoreRow = ({ item }: { item: Chore }) => {
    return (
      <View style={styles.choreRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.choreInfo}>
          <Text style={styles.choreName}>
            {item.roomate_responsible}: {item.name}
          </Text>
          <Text style={styles.choreDate}>Ends: {new Date(item.ends).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.remind}>Remind</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Your Chores Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Chores</Text>
        {yourChores.length > 0 ? (
          <FlatList
            data={yourChores}
            renderItem={renderChoreRow}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
        ) : (
          <Text style={styles.emptyText}>You have no chores assigned.</Text>
        )}
      </View>

      {/* Roommates' Chores Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Roommates Chores</Text>
        {roommatesChores.length > 0 ? (
          <FlatList
            data={roommatesChores}
            renderItem={renderChoreRow}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
        ) : (
          <Text style={styles.emptyText}>Your roommates have no chores assigned.</Text>
        )}
      </View>
      {/* Assign a Chore Button */}
      <TouchableOpacity style={styles.fab} onPress={() => console.log("Assign a Chore button pressed")}>
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Assign</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF", // Screen background
  },
  card: {
    backgroundColor: "#F4FFF8", // Light greenish background
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007F5F", // Dark green title
    marginBottom: 10,
  },
  list: {
    marginTop: 10,
    maxHeight: 200,
  },
  choreRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#FFFFFF", // White background for rows
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CDEEEE", // Light blue avatar
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007F5F", // Dark green text for avatar
  },
  choreInfo: {
    flex: 1,
  },
  choreName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333", // Dark text for chore names
  },
  choreDate: {
    fontSize: 14,
    color: "#666", // Gray text for dates
  },
  remind: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007FFF", // Blue "Remind" text
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row", // Icon and text side by side
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00D09E", // Bright green
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12, // Softened corners
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: {
    fontSize: 14, // Smaller font size
    fontWeight: "bold",
    color: "#FFFFFF",
    textDecorationLine: "underline", // Underlined text
    marginLeft: 8, // Spacing between icon and text
  },
});
