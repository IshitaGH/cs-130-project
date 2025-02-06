import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

type Chore = {
  id: string;
  name: string;
  roommate_responsible: string;
  ends: string;
  autorotate: boolean;
};

const currentUser = "Byron";

const initialMockChores: Chore[] = [
  { id: "1", name: "Dishes", roommate_responsible: "Byron", ends: "2025-03-01T23:59:59Z", autorotate: true },
  { id: "2", name: "Clean Kitchen", roommate_responsible: "Claire", ends: "2025-04-01T23:59:59Z", autorotate: false },
];

export default function ChoresScreen() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newChoreName, setNewChoreName] = useState("");
  const [roommate, setRoommate] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const yourChores = chores.filter((chore) => chore.roommate_responsible === currentUser);
  const roommatesChores = chores.filter((chore) => chore.roommate_responsible !== currentUser);

  const addChore = () => {
    if (!newChoreName.trim() || !roommate.trim() || !dueDate) return;

    const newChore: Chore = {
      id: (chores.length + 1).toString(),
      name: newChoreName,
      roommate_responsible: roommate,
      ends: dueDate,
      autorotate: true,
    };

    setChores([...chores, newChore]);
    setNewChoreName("");
    setRoommate("");
    setDueDate(null);
    setModalVisible(false);
  };

  const renderChoreRow = ({ item }: { item: Chore }) => (
    <View style={styles.choreRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.choreInfo}>
        <Text style={styles.choreName}>
          {item.roommate_responsible}: {item.name}
        </Text>
        <Text style={styles.choreDate}>Ends: {new Date(item.ends).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.remind}>Remind</Text>
    </View>
  );

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

      {/* Assign a Chore Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Assign</Text>
      </TouchableOpacity>

      {/* Modal for Creating a Chore */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create a New Chore</Text>

            {/* Chore Name Input */}
            <TextInput
              style={styles.input}
              placeholder="Chore Name"
              placeholderTextColor="#AAA"
              value={newChoreName}
              onChangeText={setNewChoreName}
            />

            {/* Roommate Responsible Input */}
            <TextInput
              style={styles.input}
              placeholder="Roommate Responsible"
              placeholderTextColor="#AAA"
              value={roommate}
              onChangeText={setRoommate}
            />

            {/* Due Date Picker */}
            <TouchableOpacity style={styles.datePicker} onPress={() => setDatePickerVisible(true)}>
              <MaterialIcons name="calendar-today" size={20} color="#007FFF" />
              <Text style={styles.dateText}>
                {dueDate ? new Date(dueDate).toLocaleDateString() : "Select Due Date"}
              </Text>
            </TouchableOpacity>

            {/* Date Picker Modal */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={(date) => {
                setDueDate(date.toISOString());
                setDatePickerVisible(false);
              }}
              onCancel={() => setDatePickerVisible(false)}
            />

            {/* Save Chore Button */}
            <TouchableOpacity style={styles.submitButton} onPress={addChore}>
              <Text style={styles.submitButtonText}>Save Chore</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFFFFF" },
  card: { backgroundColor: "#DFF7E280", borderRadius: 12, padding: 15, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  choreText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  choreDate: { fontSize: 14, color: "#666" },
  emptyText: { fontSize: 14, color: "#999", fontStyle: "italic", textAlign: "center" },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { backgroundColor: "#FFFFFF", padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, minHeight: Dimensions.get("window").height * 0.4 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#CCC", borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16, color: "#333" },
  datePicker: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#CCC", borderRadius: 8, padding: 10, marginBottom: 15 },
  dateText: { marginLeft: 10, fontSize: 16, color: "#333" },
  submitButton: { backgroundColor: "#00D09E", paddingVertical: 15, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  closeButton: { alignItems: "center", paddingVertical: 10 },
  closeButtonText: { fontSize: 16, color: "#007FFF", fontWeight: "bold" },
  choreRow: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFFFFF", borderRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#CDEEEE", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "bold", color: "#007F5F" },
  choreInfo: { flex: 1, paddingLeft: 15 },  
  choreName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  remind: { fontSize: 14, fontWeight: "bold", color: "#007FFF" },
  fab: { position: "absolute", bottom: 20, right: 20, flexDirection: "row", backgroundColor: "#00D09E", padding: 10, borderRadius: 12 },
  fabText: { color: "#FFFFFF", fontWeight: "bold", marginLeft: 8 },
});