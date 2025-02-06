import React, { useState, useEffect } from "react";
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
  Animated,
  ActionSheetIOS,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

type Chore = {
  id: string;
  name: string;
  roommate_responsible: string;
  ends: string;
  autorotate: boolean;
  completed: boolean;
};

const currentUser = "Byron";

const initialMockChores: Chore[] = [
  { id: "1", name: "Dishes", roommate_responsible: "Byron", ends: "2025-03-01T23:59:59Z", autorotate: true, completed: false },
  { id: "2", name: "Clean Kitchen", roommate_responsible: "Claire", ends: "2025-04-01T23:59:59Z", autorotate: false, completed: false },
];

export default function ChoresScreen() {
  const [chores, setChores] = useState<Chore[]>(() => JSON.parse(JSON.stringify(initialMockChores))); // deep copy so each object in chores gets its own memory reference
  const [modalVisible, setModalVisible] = useState(false);
  const [newChoreName, setNewChoreName] = useState("");
  const [roommate, setRoommate] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get("window").height)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(Dimensions.get("window").height);
    }
  }, [modalVisible, slideAnim]);

  useEffect(() => {
    if (selectedChore) {
      setNewChoreName(selectedChore.name);
      setRoommate(selectedChore.roommate_responsible);
      setDueDate(selectedChore.ends);
    } else {
      resetModal();
    }
  }, [selectedChore]);

  // dynamically update 
  const [yourChores, setYourChores] = useState<Chore[]>([]);
  const [roommatesChores, setRoommatesChores] = useState<Chore[]>([]);

  useEffect(() => {
    setYourChores(chores.filter((chore) => chore.roommate_responsible === currentUser));
    setRoommatesChores(chores.filter((chore) => chore.roommate_responsible !== currentUser));
  }, [chores]);
  
  const addOrUpdateChore = () => {
    if (!newChoreName.trim() || !roommate.trim() || !dueDate) return;

    if (selectedChore) {
      setChores((prevChores) =>
        prevChores.map((chore) =>
          chore.id === selectedChore.id
            ? { ...chore, name: newChoreName, roommate_responsible: roommate, ends: dueDate }
            : chore
        )
      );
    } else {
      const newChore: Chore = {
        id: (chores.length + 1).toString(),
        name: newChoreName,
        roommate_responsible: roommate,
        ends: dueDate,
        autorotate: true,
        completed: false,
      };
      setChores([...chores, newChore]);
    }

    resetModal();
  };

  const resetModal = () => {
    setNewChoreName("");
    setRoommate("");
    setDueDate(null);
    setSelectedChore(null);
    setModalVisible(false);
  };

  const toggleComplete = (id: string) => {
    setChores((prevChores) =>
      prevChores.map((chore) =>
        chore.id === id ? { ...chore, completed: !chore.completed } : chore
      )
    );
  };

  const deleteChore = (id: string) => {
    setChores((prevChores) => prevChores.filter((chore) => chore.id !== id));
  };

  const remindChore = (chore: Chore) => {
    alert(`Reminder sent for ${chore.name}!`);
  };

  const openActionMenu = (chore: Chore) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Remind", "Mark as Complete", "Edit", "Delete", "Cancel"],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 4,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) remindChore(chore);
          else if (buttonIndex === 1) toggleComplete(chore.id);
          else if (buttonIndex === 2) {
            setSelectedChore(chore);
            setModalVisible(true);
          }
          else if (buttonIndex === 3) deleteChore(chore.id);
        }
      );
    } else {
      setSelectedChore(chore);
      setAndroidMenuVisible(true);
    }
  };

  const renderChoreRow = ({ item }: { item: Chore }) => (
    <View style={[styles.choreRow, item.completed && styles.completedRow]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.choreInfo}>
        <Text style={[styles.choreName, item.completed && styles.strikethrough]}>
          {item.roommate_responsible}: {item.name}
        </Text>
        <Text style={styles.choreDate}>Ends: {new Date(item.ends).toLocaleDateString()}</Text>
      </View>
      <TouchableOpacity onPress={() => openActionMenu(item)}>
        <MaterialIcons name="more-vert" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );


  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Chores</Text>
        <FlatList data={yourChores} renderItem={renderChoreRow} keyExtractor={(item) => item.id} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Roommates' Chores</Text>
        <FlatList data={roommatesChores} renderItem={renderChoreRow} keyExtractor={(item) => item.id} />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Assign</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.modalTitle}>
              {selectedChore ? "Edit Chore" : "Create a New Chore"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Chore Name"
              placeholderTextColor="#AAA"
              value={newChoreName}
              onChangeText={setNewChoreName}
            />

            <TextInput
              style={styles.input}
              placeholder="Roommate Responsible"
              placeholderTextColor="#AAA"
              value={roommate}
              onChangeText={setRoommate}
            />

            <TouchableOpacity style={styles.datePicker} onPress={() => setDatePickerVisible(true)}>
              <MaterialIcons name="calendar-today" size={20} color="#007FFF" />
              <Text style={styles.dateText}>
                {dueDate ? new Date(dueDate).toLocaleDateString() : "Select Due Date"}
              </Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={(date) => {
                setDueDate(date.toISOString());
                setDatePickerVisible(false);
              }}
              onCancel={() => setDatePickerVisible(false)}
            />

            <TouchableOpacity style={styles.submitButton} onPress={addOrUpdateChore}>
              <Text style={styles.submitButtonText}>{selectedChore ? "Update Chore" : "Save Chore"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={resetModal}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFFFFF" },
  card: { backgroundColor: "#DFF7E280", borderRadius: 12, padding: 15, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  choreDate: { fontSize: 14, color: "#666" },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: Dimensions.get("window").height * 0.4,
  },
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
  strikethrough: { textDecorationLine: "line-through", color: "#999" },
  completedRow: { backgroundColor: "#E0FFE6" },
});
