import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Button, TextInput, Alert, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

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
];

export default function ChoresScreen() {
  const [chores, setChores] = useState<Chore[]>(initialMockChores);
  const [modalVisible, setModalVisible] = useState(false);
  const [newChore, setNewChore] = useState({ name: "", roomate_responsible: "", ends: new Date(), autorotate: false });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const yourChores = chores.filter((chore) => chore.roomate_responsible === currentUser);
  const roommatesChores = chores.filter((chore) => chore.roomate_responsible !== currentUser);

  const handleAddChore = () => {
    if (!newChore.name || !newChore.roomate_responsible) {
      Alert.alert("Validation Error", "Please provide both a chore name and assigned roommate.");
      return;
    }

    if (newChore.ends < new Date()) {
      Alert.alert("Validation Error", "The due date cannot be in the past.");
      return;
    }

    const newId = (chores.length + 1).toString();
    setChores([
      ...chores,
      {
        id: newId,
        name: newChore.name,
        roomate_responsible: newChore.roomate_responsible,
        ends: newChore.ends.toISOString(),
        autorotate: newChore.autorotate,
      },
    ]);
    setModalVisible(false);
    setNewChore({ name: "", roomate_responsible: "", ends: new Date(), autorotate: false });
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

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setNewChore((prev) => ({ ...prev, ends: selectedDate }));
    }
    setShowDatePicker(false);
  };

  return (
    <View style={styles.container}>
      {/* your chores */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Chores</Text>
        <FlatList data={yourChores} renderItem={renderChoreRow} keyExtractor={(item) => item.id} />
      </View>

      {/* roommates' chores */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Roommates' Chores</Text>
        <FlatList data={roommatesChores} renderItem={renderChoreRow} keyExtractor={(item) => item.id} />
      </View>

      {/* assign */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Assign</Text>
      </TouchableOpacity>

      {/* add new chore*/}
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

          {/* open date picker*/}
          <Button title="Select Due Date" onPress={() => setShowDatePicker(true)} />
          <Text style={styles.selectedDate}>
            Selected Date: {newChore.ends.toLocaleDateString()}
          </Text>

          {/* datepicker */}
          {showDatePicker && (
            <DateTimePicker
              value={newChore.ends}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={handleDateChange}
            />
          )}

          <Button title="Add Chore" onPress={handleAddChore} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFFFFF" },
  card: { backgroundColor: "#F4FFF8", padding: 15, borderRadius: 12, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  choreRow: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFFFFF", borderRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#CDEEEE", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "bold", color: "#007F5F" },
  choreInfo: { flex: 1, paddingLeft: 15 },  
  choreName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  choreDate: { fontSize: 14, color: "#666" },
  remind: { fontSize: 14, fontWeight: "bold", color: "#007FFF" },
  fab: { position: "absolute", bottom: 20, right: 20, flexDirection: "row", backgroundColor: "#00D09E", padding: 10, borderRadius: 12 },
  fabText: { color: "#FFFFFF", fontWeight: "bold", marginLeft: 8 },
  modalContainer: { padding: 20, backgroundColor: "#FFFFFF", flex: 1, justifyContent: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, borderRadius: 8, borderColor: "#CCCCCC", marginBottom: 15 },
  selectedDate: { fontSize: 16, fontWeight: "bold", color: "#007F5F", marginVertical: 10, textAlign: "center" },  // Center the date
});
