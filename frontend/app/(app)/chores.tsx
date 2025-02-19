import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActionSheetIOS,
  RefreshControl,
  Switch,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useSession } from "@/contexts/AuthContext";
import { apiGetChores } from "@/utils/api/apiClient";

type Chore = {
  id: string;
  name: string;
  roommate_responsible: string;
  ends: string;
  autorotate: boolean;
  is_task: boolean;
  completed: boolean;
  recurrence?: string; // new field for recurrence frequency
};

const currentUser = "Byron";

const initialMockChores: Chore[] = [
  { id: "1", name: "Dishes", roommate_responsible: "Byron", ends: "2025-03-01T23:59:59Z", autorotate: true, is_task: true, completed: false, recurrence: "none" },
  { id: "2", name: "Clean Kitchen", roommate_responsible: "Byron", ends: "2025-04-01T23:59:59Z", autorotate: false, is_task: false, completed: false, recurrence: "weekly" },
  { id: "3", name: "Vacuum Living Room", roommate_responsible: "David", ends: "2025-05-01T23:59:59Z", autorotate: true, is_task: true, completed: false, recurrence: "daily" },
  { id: "4", name: "Take Out Trash", roommate_responsible: "David", ends: "2025-06-01T23:59:59Z", autorotate: false, is_task: false, completed: false, recurrence: "monthly" },
  { id: "5", name: "Mop Bathroom", roommate_responsible: "Byron", ends: "2025-07-01T23:59:59Z", autorotate: true, is_task: true, completed: false, recurrence: "none" },
  { id: "6", name: "Wash Car", roommate_responsible: "Byron", ends: "2025-08-01T23:59:59Z", autorotate: false, is_task: false, completed: false, recurrence: "none" },
  { id: "7", name: "Water Plants", roommate_responsible: "Byron", ends: "2025-09-01T23:59:59Z", autorotate: true, is_task: true, completed: false, recurrence: "daily" },
  { id: "8", name: "Feed Pets", roommate_responsible: "Byron", ends: "2025-10-01T23:59:59Z", autorotate: false, is_task: false, completed: false, recurrence: "none" },
];

export default function ChoresScreen() {
  const [chores, setChores] = useState<Chore[]>(() => JSON.parse(JSON.stringify(initialMockChores)));
  const [modalVisible, setModalVisible] = useState(false);
  const [newChoreName, setNewChoreName] = useState("");
  const [roommate, setRoommate] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const [refreshing, setRefreshing] = useState(false);
  const { session, userId } = useSession();

  // New state for whether the chore is a task (completable)
  const [isTask, setIsTask] = useState(true);
  // New state for recurrence frequency ("none", "daily", "weekly", "monthly")
  const [recurrence, setRecurrence] = useState("none");

  // Derived state for display (your chores vs. roommates' chores)
  const [yourChores, setYourChores] = useState<Chore[]>([]);
  const [roommatesChores, setRoommatesChores] = useState<Chore[]>([]);

  useEffect(() => {
    setYourChores(chores.filter((chore) => chore.roommate_responsible === currentUser));
    setRoommatesChores(chores.filter((chore) => chore.roommate_responsible !== currentUser));
  }, [chores]);

  // TODO: once backend is setup, the chores should be fetched when the screen is opened
  // useEffect(() => {
  //   const fetchInitialChores = async () => {
  //     try {
  //       const fetchedChores = await apiGetChores(session);
  //       setChores(fetchedChores);
  //     } catch (error) {
  //       console.error('Error fetching initial chores:', error);
  //     }
  //   };
  //   fetchInitialChores();
  // }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    const fetchChores = async () => {
      try {
        const fetchedChores = await apiGetChores(session);
        setChores(fetchedChores);
      } catch (error) {
        console.error('Error fetching chores:', error);
      } finally {
        setRefreshing(false);
      }
    };
    fetchChores();
  };

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
      setIsTask(selectedChore.is_task);
      setRecurrence(selectedChore.recurrence || "none");
    } else {
      resetModal();
    }
  }, [selectedChore]);

  const addOrUpdateChore = () => {
    if (!newChoreName.trim() || !roommate.trim() || !dueDate) return;

    if (selectedChore) {
      setChores(prevChores =>
        prevChores.map(chore =>
          chore.id === selectedChore.id
            ? {
                ...chore,
                name: newChoreName,
                roommate_responsible: roommate,
                ends: dueDate,
                is_task: isTask,
                recurrence: recurrence,
                autorotate: isTask, // if something is a task, it should autorotate (logic here can be changed)
              }
            : chore
        )
      );
    } else {
      const newChore: Chore = {
        id: (chores.length + 1).toString(),
        name: newChoreName,
        roommate_responsible: roommate,
        ends: dueDate,
        is_task: isTask,
        autorotate: isTask,
        completed: false,
        recurrence: recurrence,
      };
      setChores([...chores, newChore]);
    }

    resetModal();
  };

  const resetModal = () => {
    setNewChoreName("");
    setRoommate("");
    setDueDate(null);
    setIsTask(true);
    setRecurrence("none");
    setSelectedChore(null);
    setModalVisible(false);
  };

  const toggleComplete = (id: string) => {
    setChores(prevChores =>
      prevChores.map(chore =>
        chore.id === id ? { ...chore, completed: !chore.completed } : chore
      )
    );
  };

  const deleteChore = (id: string) => {
    setChores(prevChores => prevChores.filter(chore => chore.id !== id));
  };

  const remindChore = (chore: Chore) => {
    alert(`Reminder sent for ${chore.name}!`);
  };

  const openActionMenu = (chore: Chore) => {
    const completeActionLabel = chore.completed ? "Mark as Incomplete" : "Mark as Complete";

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Remind", completeActionLabel, "Edit", "Delete", "Cancel"],
          destructiveButtonIndex: 3,
          cancelButtonIndex: 4,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) remindChore(chore);
          else if (buttonIndex === 1) toggleComplete(chore.id);
          else if (buttonIndex === 2) {
            setSelectedChore(chore);
            setModalVisible(true);
          } else if (buttonIndex === 3) deleteChore(chore.id);
        }
      );
    } else {
      setSelectedChore(chore);
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
        <Text style={styles.choreDate}>Recurrence: {item.recurrence || "None"}</Text>
      </View>
      <TouchableOpacity onPress={() => openActionMenu(item)}>
        <MaterialIcons name="more-vert" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const sections = [
    { title: "Your Chores", data: yourChores },
    { title: "Roommates' Chores", data: roommatesChores },
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderChoreRow({ item })}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00D09E"
            colors={["#00D09E"]}
          />
        }
      />

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

            {/* Is Task Switch */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Is this a task?</Text>
              <Switch
                value={isTask}
                onValueChange={(newValue) => setIsTask(newValue)}
              />
            </View>

            {/* Custom Dropdown for Recurrence */}
            <Text style={styles.label}>Recurrence</Text>
            <View style={styles.dropdown}>
              {["none", "daily", "weekly", "monthly"].map((option) => (
                <TouchableOpacity key={option} onPress={() => setRecurrence(option)}>
                  <Text style={[styles.option, recurrence === option && styles.selectedOption]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.datePicker} onPress={() => setDatePickerVisible(true)}>
              <MaterialIcons name="calendar-today" size={20} color="#007FFF" />
              <Text style={styles.dateText}>
                {dueDate ? new Date(dueDate).toLocaleDateString() : "Select Due Date"}
              </Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              minimumDate={new Date()}
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
  listContent: { paddingBottom: 100 },
  sectionHeader: { backgroundColor: "#FFFFFF", paddingVertical: 10, paddingHorizontal: 15 },
  sectionHeaderText: { fontSize: 18, fontWeight: "bold", color: "#007F5F" },
  input: { borderWidth: 1, borderColor: "#CCC", borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16, color: "#333" },
  datePicker: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#CCC", borderRadius: 8, padding: 10, marginBottom: 15 },
  dateText: { marginLeft: 10, fontSize: 16, color: "#333" },
  submitButton: { backgroundColor: "#00D09E", paddingVertical: 15, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  closeButton: { alignItems: "center", paddingVertical: 10 },
  closeButtonText: { fontSize: 16, color: "#007FFF", fontWeight: "bold" },
  choreRow: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFFFFF", borderRadius: 8, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#CDEEEE", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "bold", color: "#007F5F" },
  choreInfo: { flex: 1, paddingLeft: 15 },
  choreName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  choreDate: { fontSize: 14, color: "#666" },
  strikethrough: { textDecorationLine: "line-through", color: "#999" },
  completedRow: { backgroundColor: "#E0FFE6" },
  fab: { position: "absolute", bottom: 20, right: 20, flexDirection: "row", backgroundColor: "#00D09E", padding: 10, borderRadius: 12 },
  fabText: { color: "#FFFFFF", fontWeight: "bold", marginLeft: 8 },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { backgroundColor: "#FFFFFF", padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16, minHeight: Dimensions.get("window").height * 0.4 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  switchContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  switchLabel: { fontSize: 16, color: "#333", marginRight: 10 },
  label: { fontSize: 16, fontWeight: "bold", color: "#007F5F", marginBottom: 5 },
  dropdown: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  option: { padding: 10, backgroundColor: "#EEE", borderRadius: 5, fontSize: 16, color: "#333" },
  selectedOption: { backgroundColor: "#00D09E", color: "#FFFFFF" },
  pickerLabel: { fontSize: 16, color: "#333", marginBottom: 5 },
  picker: { height: 50, marginBottom: 15 },
});
