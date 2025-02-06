import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Chore = {
  id: string;
  name: string;
  roomate_responsible: string;
  ends: string;
  autorotate: boolean;
};

const currentUser = "Byron";

const initialMockChores: Chore[] = [
  { id: "1", name: "Dishes", roomate_responsible: "Byron", ends: "2025-03-01T23:59:59Z", autorotate: true },
  { id: "2", name: "Clean Kitchen", roomate_responsible: "Claire", ends: "2025-04-01T23:59:59Z", autorotate: false },
  { id: "3", name: "Trash", roomate_responsible: "Byron", ends: "2025-03-01T23:59:59Z", autorotate: true },
  { id: "4", name: "Vacuum", roomate_responsible: "Claire", ends: "2025-04-05T23:59:59Z", autorotate: false },
];

export default function ChoresScreen() {
  const [chores, setChores] = useState<Chore[]>(initialMockChores);
  const [modalVisible, setModalVisible] = useState(false);
  const [newChore, setNewChore] = useState({ name: "", roomate_responsible: "", ends: "", autorotate: false });

  const yourChores = chores.filter((chore) => chore.roomate_responsible === currentUser);
  const roommatesChores = chores.filter((chore) => chore.roomate_responsible !== currentUser);

  const handleAddChore = () => {
    const newId = (chores.length + 1).toString();
    setChores([
      ...chores,
      {
        id: newId,
        name: newChore.name,
        roomate_responsible: newChore.roomate_responsible,
        ends: newChore.ends,
        autorotate: newChore.autorotate,
      },
    ]);
    setModalVisible(false);
    setNewChore({ name: "", roomate_responsible: "", ends: "", autorotate: false });  // Reset form
  };

  const renderChoreRow = ({ item }: { item: Chore }) => (
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

  return (
    <View style={styles.container}>
      {/* Your Chores Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Chores</Text>
        {yourChores.length > 0 ? (
          <FlatList data={yourChores} renderItem={renderChoreRow} keyExtractor={(item) => item.id} />
        ) : (
          <Text style={styles.emptyText}>You have no chores assigned.</Text>
        )}
      </View>

      {/* Roommates' Chores Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Roommates' Chores</Text>
        {roommatesChores.length > 0 ? (
          <FlatList data={roommatesChores} renderItem={renderChoreRow} keyExtractor={(item) => item.id} />
        ) : (
          <Text style={styles.emptyText}>Your roommates have no chores assigned.</Text>
        )}
      </View>

      {/* Assign a Chore Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Assign</Text>
      </TouchableOpacity>

      {/* Quick Create Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Assign a New Chore</Text>
          <TextInput
            placeholder="Chore Name"
            value={newChore.name}
            onChangeText={(text) => setNewChore((prev) => ({ ...prev, name: text }))}
            style={styles.input}
          />
          <TextInput
            placeholder="Roommate Responsible"
            value={newChore.roomate_responsible}
            onChangeText={(text) => setNewChore((prev) => ({ ...prev, roomate_responsible: text }))}
            style={styles.input}
          />
          <TextInput
            placeholder="End Date (YYYY-MM-DD)"
            value={newChore.ends}
            onChangeText={(text) => setNewChore((prev) => ({ ...prev, ends: text }))}
            style={styles.input}
          />
          <Button title="Add Chore" onPress={handleAddChore} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  card: {
    backgroundColor: "#F4FFF8",
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
    color: "#007F5F",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CDEEEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007F5F",
  },
  choreInfo: {
    flex: 1,
  },
  choreName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  choreDate: {
    fontSize: 14,
    color: "#666",
  },
  remind: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007FFF",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00D09E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
    textDecorationLine: "underline",
    marginLeft: 8,
  },
  modalContainer: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#007F5F",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
});
