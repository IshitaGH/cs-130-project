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
  RefreshControl,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiGetChores, apiUpdateChore, apiCreateChore, apiDeleteChore, apiGetRoommates } from "@/utils/api/apiClient";
import Toast from "react-native-toast-message";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

function getCurrentDate() {
  const localDate = new Date();
  localDate.setHours(0, 0, 0, 0);
  return localDate.toISOString();
}

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
  const [choreIsTask, setChoreIsTask] = useState(false);
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
  const [expandedChoreId, setExpandedChoreId] = useState<number | null>(null);


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
          start_date: getCurrentDate(),
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
          getCurrentDate(),
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
    setChoreIsTask(false);
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

  const renderChoreRow = ({ item }: { item: Chore }) => {
    const swipeableRef = React.useRef<Swipeable | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleComplete = async (id: number) => {
      const chore = chores.find(c => c.id === id);
      if (!chore) return;

      if (!chore.is_task) {
        Toast.show({
          type: 'error',
          text1: 'Cannot Complete',
          text2: "This chore is an ongoing responsibility and cannot be marked as complete."
        });
        swipeableRef.current?.close();
        return;
      }

      setIsUpdating(true);
      await toggleComplete(id);
      swipeableRef.current?.close();
      setTimeout(() => {
        setIsUpdating(false);
      }, 300);
    };

    const handleDelete = async (id: number) => {
      Alert.alert(
        "Delete Chore",
        "Are you sure you want to delete this chore?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              swipeableRef.current?.close();
            }
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setIsUpdating(true);
              await deleteChore(id);
              swipeableRef.current?.close();
            }
          }
        ]
      );
    };

    if (isUpdating) {
      return <View style={styles.placeholderRow} />;
    }

    const renderRightActions = (progress: any, dragX: any) => (
      <View style={[
        styles.rightActions, 
        { 
          backgroundColor: item.completed ? '#666666' : '#00D09E',
          borderRadius: 8,
          marginBottom: 0
        }
      ]}>
        <Animated.View style={styles.completeAction}>
          <MaterialIcons 
            name={item.completed ? "undo" : "check"} 
            size={24} 
            color="#FFF" 
          />
        </Animated.View>
      </View>
    );

    const renderLeftActions = (progress: any, dragX: any) => (
      <View style={[
        styles.leftActions, 
        { 
          borderRadius: 8,
          marginBottom: 0
        }
      ]}>
        <Animated.View style={styles.deleteAction}>
          <MaterialIcons name="delete" size={24} color="#FFF" />
        </Animated.View>
      </View>
    );

    return (
      <View style={[
        styles.choreContainer,
        { marginBottom: 2 }
      ]}>
        <Swipeable
          ref={swipeableRef}
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          rightThreshold={100}
          leftThreshold={100}
          onSwipeableRightOpen={() => handleComplete(item.id)}
          onSwipeableLeftOpen={() => handleDelete(item.id)}
          containerStyle={styles.swipeableContainer}
        >
          <View style={[
            styles.choreRowWrapper,
            { backgroundColor: 'white' }
          ]}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.choreRow,
                { 
                  borderBottomLeftRadius: expandedChoreId === item.id ? 0 : 8,
                  borderBottomRightRadius: expandedChoreId === item.id ? 0 : 8,
                  marginBottom: 0
                }
              ]}
              onPress={() => setExpandedChoreId(expandedChoreId === item.id ? null : item.id)}
              onLongPress={() => {
                setSelectedChore(item);
                setModalVisible(true);
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {`${item.assigned_roommate.first_name.charAt(0)}${item.assigned_roommate.last_name.charAt(0)}`}
                </Text>
              </View>
              <View style={styles.choreInfo}>
                <View style={styles.choreNameRow}>
                  <Text style={[styles.choreName, item.completed && styles.strikethrough]}>
                    {item.description}
                  </Text>
                  <Text style={styles.choreDate}>
                    Ends {new Date(item.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => remindChore(item)}
                style={styles.bellButton}
              >
                <MaterialIcons name="notifications" size={24} color="#666" />
              </TouchableOpacity>
            </TouchableOpacity>
            {expandedChoreId === item.id && (
              <View style={[styles.expandedDetails, { marginBottom: 0 }]}>
                <Text style={styles.detailText}>
                  Recurrence: {item.recurrence || "None"}
                </Text>
              </View>
            )}
          </View>
        </Swipeable>
      </View>
    );
  };

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.modalContainer}
          >
            <TouchableOpacity 
              style={styles.modalContainer} 
              activeOpacity={1} 
              onPress={() => resetModal()}
            >
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
              >
                <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
                  <Text style={styles.modalTitle}>
                    {selectedChore ? "Edit Chore" : "Create a New Chore"}
                  </Text>

                  <TextInput
                    style={styles.input}
                    placeholder="Description"
                    placeholderTextColor="#AAA"
                    value={choreName}
                    onChangeText={setChoreName}
                  />

                  <Text style={styles.label}>Roommate Responsible</Text>
                  <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.roommateScrollContainer}
                  >
                    {roommates
                      .sort((a, b) => {
                        if (a.id === userId) return -1;
                        if (b.id === userId) return 1;
                        return 0;
                      })
                      .map((roommate) => (
                      <TouchableOpacity
                        key={roommate.id}
                        onPress={() => setSelectedRoommateId(roommate.id)}
                        style={[
                          styles.roommateOption,
                          selectedRoommateId === roommate.id && styles.selectedRoommateOption
                        ]}
                      >
                        <View style={styles.roommateAvatar}>
                          <Text style={styles.roommateAvatarText}>
                            {`${roommate.first_name.charAt(0)}${roommate.last_name.charAt(0)}`}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.roommateName,
                            selectedRoommateId === roommate.id && styles.selectedRoommateName
                          ]}
                        >
                          {roommate.id === userId ? "You" : roommate.first_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

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
                      localDate.setHours(23, 59, 59, 999);
                      setChoreEndDate(localDate.toISOString());
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
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </GestureHandlerRootView>
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
  choreRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 10, 
    backgroundColor: "#FFFFFF", 
    borderRadius: 8, 
    marginBottom: 0
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#CDEEEE", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "bold", color: "#007F5F" },
  choreInfo: { 
    flex: 1, 
    paddingLeft: 15 
  },
  choreNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  choreName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  choreDate: { 
    fontSize: 14, 
    color: "#666" 
  },
  remind: { fontSize: 14, fontWeight: "bold", color: "#007FFF" },
  fab: { position: "absolute", bottom: 20, right: 20, flexDirection: "row", backgroundColor: "#00D09E", padding: 10, borderRadius: 12 },
  fabText: { color: "#FFFFFF", fontWeight: "bold", marginLeft: 8, alignSelf: "center" },
  strikethrough: { textDecorationLine: "line-through", color: "#999" },
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
  roommateScrollContainer: {
    paddingBottom: 10,
  },
  roommateOption: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    minWidth: 100,
  },
  selectedRoommateOption: {
    backgroundColor: '#00D09E',
    borderColor: '#00D09E',
  },
  roommateAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CDEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  roommateAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007F5F',
  },
  roommateName: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedRoommateName: {
    color: '#FFFFFF',
  },
  expandedDetails: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginBottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  rightActions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: '#00D09E',
    borderRadius: 8,
  },
  leftActions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: '#FF4444',
    borderRadius: 8,
  },
  completeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  bellButton: {
    padding: 8,
  },
  placeholderRow: {
    height: 50,
    backgroundColor: '#F5F5F5',
  },
  choreContainer: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  swipeableContainer: {
    backgroundColor: 'transparent',
  },
  choreRowWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  choreRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 10, 
    backgroundColor: "#FFFFFF",
  },
});
