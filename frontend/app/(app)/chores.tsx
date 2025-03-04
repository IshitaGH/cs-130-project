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

type Chore = {
  id: number;
  description: string;
  start_date: string;
  end_date: string;
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
  rotation_order: number[] | null;
};

type Roommate = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
};

const utils = {
  getCurrentDate: () => {
    const localDate = new Date();
    localDate.setHours(0, 0, 0, 0);
    return localDate.toISOString();
  },

  calculateEndDate: (recurrence: string): string => {
    const now = new Date();
    const endDate = new Date(now);

    switch (recurrence) {
      case 'daily':
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        endDate.setDate(now.getDate() + (7 - now.getDay()));
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }
    return endDate.toISOString();
  },

  getInitials: (firstName: string, lastName: string): string =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`
};

export default function ChoresScreen() {
  const { session, userId } = useAuthContext();

  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [yourChores, setYourChores] = useState<Chore[]>([]);
  const [roommatesChores, setRoommatesChores] = useState<Chore[]>([]);

  const [choreName, setChoreName] = useState("");
  const [choreIsTask, setChoreIsTask] = useState(false);
  const [choreRecurrence, setChoreRecurrence] = useState("none");
  const [choreEndDate, setChoreEndDate] = useState<string | null>(null);
  const [selectedRoommateId, setSelectedRoommateId] = useState<number | null>(null);
  const [rotationOrder, setRotationOrder] = useState<number[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
  const [expandedChoreId, setExpandedChoreId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get("window").height)).current;

  const api = {
    fetchChores: async () => {
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
    },

    fetchRoommates: async () => {
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
    }
  };

  useEffect(() => {
    api.fetchChores();
    api.fetchRoommates();
  }, [session]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([api.fetchChores(), api.fetchRoommates()]);
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
      setIsRecurring(selectedChore.recurrence !== "none");
      setRotationOrder(selectedChore.rotation_order || []);
    } else {
      resetModal();
    }
  }, [selectedChore]);

  const validateChoreForm = (): boolean => {
    if (!choreName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Must fill in name'
      });
      return false;
    }

    if (!isRecurring && !selectedRoommateId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Must select a roommate'
      });
      return false;
    }

    if (isRecurring && choreRecurrence === "none") {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a recurrence pattern'
      });
      return false;
    }

    if (isRecurring && rotationOrder.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select rotation order'
      });
      return false;
    }

    if (!isRecurring && !choreEndDate) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Must select a due date'
      });
      return false;
    }

    return true;
  };

  const addOrUpdateChore = async () => {
    if (!validateChoreForm()) return;

    // For recurring chores, use the first roommate in rotation order
    const effectiveRoommateId = isRecurring ? rotationOrder[0] : selectedRoommateId;

    // Set end date based on recurrence
    let calculatedEndDate = choreEndDate;
    if (isRecurring) {
      calculatedEndDate = utils.calculateEndDate(choreRecurrence);
    }

    if (!calculatedEndDate) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Must select a due date for non-recurring chores'
      });
      return;
    }

    try {
      if (selectedChore) {
        const updatedChore = await apiUpdateChore(session, selectedChore.id, {
          description: choreName,
          start_date: utils.getCurrentDate(),
          end_date: calculatedEndDate,
          is_task: choreIsTask,
          recurrence: choreRecurrence,
          assigned_roommate_id: effectiveRoommateId as number,
          rotation_order: isRecurring ? rotationOrder : null
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
          utils.getCurrentDate(),
          calculatedEndDate,
          choreIsTask,
          choreRecurrence,
          effectiveRoommateId as number, // type assertion since is validated earlier
          isRecurring ? rotationOrder : null
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
    setChoreEndDate(null);
    setChoreIsTask(false);
    setChoreRecurrence("none");
    setIsRecurring(false);
    setSelectedChore(null);
    setRotationOrder([]);
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
                  {utils.getInitials(item.assigned_roommate.first_name, item.assigned_roommate.last_name)}
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
                  Type: {item.is_task ? 'Task' : 'Responsibility'}
                </Text>
                
                <Text style={[styles.detailText, { marginTop: 8 }]}>
                  Recurrence: {item.recurrence || 'None'}
                </Text>
                
                {item.recurrence !== "none" && item.rotation_order && (
                  <>
                    <Text style={[styles.detailText, { marginTop: 8 }]}>
                      Rotation Order:
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.rotationScrollContainer}
                    >
                      {item.rotation_order.map((roommateId, index) => {
                        const roommate = roommates.find(r => r.id === roommateId);
                        if (!roommate) return null;
                        
                        return (
                          <View key={roommateId} style={styles.rotationItem}>
                            <View style={[
                              styles.rotationAvatar,
                              roommateId === item.assigned_roommate.id && styles.activeRotationAvatar
                            ]}>
                              <Text style={styles.rotationAvatarText}>
                                {utils.getInitials(roommate.first_name, roommate.last_name)}
                              </Text>
                            </View>
                            {item.rotation_order && index < item.rotation_order.length - 1 && (
                              <MaterialIcons 
                                name="arrow-forward" 
                                size={16} 
                                color="#666" 
                                style={styles.rotationArrow}
                              />
                            )}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </>
                )}
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
                  keyboardType="default"
                />

                {/* Is Task Switch */}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Is this a task?</Text>
                  <Switch
                    value={choreIsTask}
                    onValueChange={(newValue) => setChoreIsTask(newValue)}
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Is this recurring?</Text>
                  <Switch
                    value={isRecurring}
                    onValueChange={(newValue) => {
                      setIsRecurring(newValue);
                      if (newValue) {
                        setChoreEndDate(null);
                      } else {
                        setChoreRecurrence("none");
                      }
                    }}
                  />
                </View>

                {!isRecurring && (
                  <>
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
                                {utils.getInitials(roommate.first_name, roommate.last_name)}
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
                  </>
                )}

                {isRecurring && (
                  <>
                    <Text style={styles.label}>Recurrence</Text>
                    <View style={styles.dropdown}>
                      {["daily", "weekly", "monthly"].map((option) => (
                        <TouchableOpacity key={option} onPress={() => setChoreRecurrence(option)}>
                          <Text style={[styles.option, choreRecurrence === option && styles.selectedOption]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {isRecurring && (
                  <>
                    <Text style={styles.label}>Rotation Order</Text>
                    <Text style={styles.sublabel}>Tap roommates in the order they should rotate</Text>
                    <ScrollView
                      horizontal={true}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.roommateScrollContainer}
                    >
                      {roommates.map((roommate) => {
                        const orderIndex = rotationOrder.indexOf(roommate.id);
                        const isInRotation = orderIndex !== -1;
                        
                        return (
                          <TouchableOpacity
                            key={roommate.id}
                            onPress={() => {
                              if (isInRotation) {
                                setRotationOrder(prev => prev.filter(id => id !== roommate.id));
                              } else {
                                setRotationOrder(prev => [...prev, roommate.id]);
                              }
                            }}
                            style={[
                              styles.roommateOption,
                              isInRotation && styles.selectedRoommateOption
                            ]}
                          >
                            <View style={styles.roommateAvatar}>
                              <Text style={styles.roommateAvatarText}>
                                {utils.getInitials(roommate.first_name, roommate.last_name)}
                              </Text>
                              {isInRotation && (
                                <View style={styles.orderBadge}>
                                  <Text style={styles.orderBadgeText}>{orderIndex + 1}</Text>
                                </View>
                              )}
                            </View>
                            <Text
                              style={[
                                styles.roommateName,
                                isInRotation && styles.selectedRoommateName
                              ]}
                            >
                              {roommate.id === userId ? "You" : roommate.first_name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                {!isRecurring && (
                  <>
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
                  </>
                )}

                <TouchableOpacity style={styles.submitButton} onPress={addOrUpdateChore}>
                  <Text style={styles.submitButtonText}>{selectedChore ? "Update Chore" : "Save Chore"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={resetModal}>
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
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
  modalContainer: { 
    flex: 1, 
    justifyContent: "flex-end", 
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: { 
    backgroundColor: "#FFFFFF", 
    padding: 20, 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    maxHeight: Dimensions.get("window").height * 0.9,
  },
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
    marginRight: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    minWidth: 80,
  },
  selectedRoommateOption: {
    backgroundColor: '#00D09E',
    borderColor: '#00D09E',
  },
  roommateAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CDEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  roommateAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007F5F',
  },
  roommateName: {
    fontSize: 12,
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
  sublabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  orderBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#007F5F',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rotationScrollContainer: {
    marginLeft: 28,
    paddingVertical: 8,
  },
  rotationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  rotationAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CDEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeRotationAvatar: {
    backgroundColor: '#00D09E',
  },
  rotationAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007F5F',
  },
  rotationArrow: {
    marginHorizontal: 4,
  },
});
