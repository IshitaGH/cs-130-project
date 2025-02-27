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
import { useAuthContext } from "@/contexts/AuthContext";
import { apiGetChores, apiUpdateChore, apiCreateChore, apiDeleteChore, apiGetRoommates } from "@/utils/api/apiClient";
import Toast from "react-native-toast-message";

// This type mimics the response structure from the backend
type Chore = {
  id: number;
  description: string;
  start_date: string;
  end_date: string;
  autorotate: boolean;
  is_task: boolean;
  completed: boolean;
  recurrence: string;
  assigned_roommate: {
    id: number;
    first_name: string;
    last_name: string;
  };
  roommate_assignor_id: number;
  room_id: number;
};

// Add after the Chore type definition
type Roommate = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
};

export default function ChoresScreen() {
  // Auth State
  const { session, userId } = useAuthContext();
  // Roommates State
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  // Chores State
  const [chores, setChores] = useState<Chore[]>([]);
  const [yourChores, setYourChores] = useState<Chore[]>([]);
  const [roommatesChores, setRoommatesChores] = useState<Chore[]>([]);
  // New/Selected Chore State
  const [choreName, setChoreName] = useState("");
  const [choreRoommate, setChoreRoommate] = useState("");
  const [choreIsTask, setChoreIsTask] = useState(true);
  const [choreRecurrence, setChoreRecurrence] = useState("none");
  const [choreEndDate, setChoreEndDate] = useState<string | null>(null);
  const [selectedRoommateId, setSelectedRoommateId] = useState<number | null>(null);
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  // Additional State
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const [refreshing, setRefreshing] = useState(false);


  const fetchChores = async () => {
    if (!session) return;
    try {
      const choresData = await apiGetChores(session);
      setChores(choresData);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Fetching Chores',
        text2: error.message || 'Failed to fetch chores'
      });
    }
  };

  const fetchRoommates = async () => {
    if (!session) return;
    try {
      const roommatesData = await apiGetRoommates(session);
      setRoommates(roommatesData);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Fetching Roommates',
        text2: error.message || 'Failed to fetch roommates'
      });
    }
  };

  useEffect(() => {
    fetchChores();
    fetchRoommates();
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchChores(), fetchRoommates()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const users = chores.filter(chore => 
      chore.assigned_roommate?.id === userId
    );
    const roommates = chores.filter(chore => 
      chore.assigned_roommate?.id !== userId
    );
  
    // Sort chores so completed ones come last
    setYourChores([...users].sort((a, b) => Number(a.completed) - Number(b.completed)));
    setRoommatesChores([...roommates].sort((a, b) => Number(a.completed) - Number(b.completed)));
  }, [chores]);
  
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
      setChoreName(selectedChore.description);
      setSelectedRoommateId(selectedChore.assigned_roommate.id);
      setChoreEndDate(selectedChore.end_date);
      setChoreIsTask(selectedChore.is_task);
      setChoreRecurrence(selectedChore.recurrence || "none");
    } else {
      resetModal();
    }
  }, [selectedChore]);

  const addOrUpdateChore = async () => {
    if (!choreName.trim() || !choreEndDate || !selectedRoommateId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Must fill in name, due date, and select a roommate'
      });
      return;
    }

    try {
      if (selectedChore) {
        const updatedChore = await apiUpdateChore(session, selectedChore.id, {
          description: choreName,
          end_date: choreEndDate,
          autorotate: choreRecurrence !== "none",
          is_task: choreIsTask,
          recurrence: choreRecurrence,
          assigned_roommate_id: selectedRoommateId
        });
        setChores(prevChores =>
          prevChores.map(chore =>
            chore.id === selectedChore.id ? updatedChore : chore
          )
        );
      } else {
        const newChore = await apiCreateChore(
          session,
          choreName,
          choreEndDate,
          (choreRecurrence !== "none"),
          choreIsTask,
          choreRecurrence,
          selectedRoommateId
        );
        setChores(prevChores => [...prevChores, newChore]);
      }
      resetModal();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Saving Chore',
        text2: error.message || 'Failed to save chore'
      });
    }
  };

  const resetModal = () => {
    setChoreName("");
    setSelectedRoommateId(null);
    setChoreRoommate("");
    setChoreEndDate(null);
    setChoreIsTask(true);
    setChoreRecurrence("none");
    setSelectedChore(null);
    setModalVisible(false);
  };

  const toggleComplete = async (id: number) => {
    const chore = chores.find(c => c.id === id);
    if (!chore) return;

    if (!chore.is_task) {
      Toast.show({
        type: 'error',
        text1: 'Cannot Complete',
        text2: "This chore is an ongoing responsibility and cannot be marked as complete."
      });
      return;
    }

    try {
      const updatedChore = await apiUpdateChore(session, id, {
        completed: !chore.completed
      });
      setChores(prevChores =>
        prevChores.map(c => c.id === id ? updatedChore : c)
      );
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Updating Chore',
        text2: error.message || 'Failed to update chore status'
      });
    }
  };
  

  const deleteChore = async (id: number) => {
    try {
      await apiDeleteChore(session, id);
      setChores(prevChores => prevChores.filter(chore => chore.id !== id));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Deleting Chore',
        text2: error.message || 'Failed to delete chore'
      });
    }
  };

  const remindChore = (chore: Chore) => {
    Toast.show({
      type: 'success',
      text1: 'Reminder Sent',
      text2: `Reminder sent for ${chore.description}!`
    });
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
        <Text style={styles.avatarText}>
          {`${item.assigned_roommate.first_name.charAt(0)}${item.assigned_roommate.last_name.charAt(0)}`}
        </Text>
      </View>
      <View style={styles.choreInfo}>
        <Text style={[styles.choreName, item.completed && styles.strikethrough]}>
          {item.description}
        </Text>
        <Text style={styles.choreDate}>
          Ends: {new Date(item.end_date).toLocaleDateString()}
        </Text>
        <Text style={styles.choreDate}>
          Recurrence: {item.recurrence || "None"}
        </Text>
      </View>
      <TouchableOpacity onPress={() => openActionMenu(item)}>
        <MaterialIcons name="more-vert" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const sections = [
    { 
      title: "Your Chores", 
      data: yourChores,
      emptyText: "You have no chores" 
    },
    { 
      title: "Roommates Chores", 
      data: roommatesChores,
      emptyText: "Your roommates have no chores" 
    },
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderChoreRow({ item })}
        renderSectionHeader={({ section: { title, data, emptyText } }) => (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
            {data.length === 0 && (
              <Text style={styles.emptyText}>{emptyText}</Text>
            )}
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
        <MaterialIcons name="edit" size={24} color="#FFFFFF" />
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
              value={choreName}
              onChangeText={setChoreName}
            />

            <Text style={styles.label}>Roommate Responsible</Text>
            <View style={styles.dropdown}>
              {roommates.map((roommate) => (
                <TouchableOpacity
                  key={roommate.id}
                  onPress={() => setSelectedRoommateId(roommate.id)}
                >
                  <Text
                    style={[
                      styles.option,
                      selectedRoommateId === roommate.id && styles.selectedOption
                    ]}
                  >
                    {`${roommate.first_name} ${roommate.last_name}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Is Task Switch */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Is this a task?</Text>
              <Switch
                value={choreIsTask}
                onValueChange={(newValue) => setChoreIsTask(newValue)}
              />
            </View>

            {/* Custom Dropdown for Recurrence */}
            <Text style={styles.label}>Recurrence</Text>
            <View style={styles.dropdown}>
              {["none", "daily", "weekly", "monthly"].map((option) => (
                <TouchableOpacity key={option} onPress={() => setChoreRecurrence(option)}>
                  <Text style={[styles.option, choreRecurrence === option && styles.selectedOption]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.datePicker} onPress={() => setDatePickerVisible(true)}>
              <MaterialIcons name="calendar-today" size={20} color="#007FFF" />
              <Text style={styles.dateText}>
                {choreEndDate ? new Date(choreEndDate).toLocaleDateString() : "Select Due Date"}
              </Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              minimumDate={new Date()}
              onConfirm={(date) => {
                const localDate = new Date(date);
                const timezoneOffset = localDate.getTimezoneOffset() * 60000;
                localDate.setHours(23, 59, 59, 999);
                // Adjust for timezone offset before converting to ISO string
                const adjustedDate = new Date(localDate.getTime() - timezoneOffset);
                setChoreEndDate(adjustedDate.toISOString());
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
  remind: { fontSize: 14, fontWeight: "bold", color: "#007FFF" },
  fab: { position: "absolute", bottom: 20, right: 20, flexDirection: "row", backgroundColor: "#00D09E", padding: 10, borderRadius: 12 },
  fabText: { color: "#FFFFFF", fontWeight: "bold", marginLeft: 8, alignSelf: "center" },
  choreDate: { fontSize: 14, color: "#666" },
  strikethrough: { textDecorationLine: "line-through", color: "#999" },
  completedRow: { backgroundColor: "#E0FFE6" },
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 10,
  },
});
