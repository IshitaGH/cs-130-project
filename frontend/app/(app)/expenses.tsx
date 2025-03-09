import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiCloseExpensePeriod, apiCreateExpense, apiDeleteExpense, apiGetExpenses, apiGetRoom, apiGetRoommates } from "@/utils/api/apiClient";

interface Expense {
  id: number;
  description: string;
  cost: number;
  roommate_fkey: number;
  created_at: string;
}

interface ExpensePeriod {
  start_date: string;
  end_date: string;
  id: number;
  open: boolean;
  expenses: Expense[];
}

interface ExpensePeriodCard extends ExpensePeriod {
  updateExpenses: (id: number, updatedExpenses: Expense[]) => void;
  sessionState: {
    session: any;
    roommates: Roommate[];
    currentUser: number;
    refresh: any;
  }
}

interface BalanceMap {
  [key: number]: number
}

type Roommate = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
};

const dateFormat = (date: Date) => {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const calculatePersonalBalances = (expenses: Expense[], setBalances: any, roommates: Roommate[], currentUser: number) => {
  let balanceSheet: BalanceMap = {};
  roommates.forEach(roommate => { balanceSheet[roommate.id] = 0 });
  let totalRoommates = roommates.length;

  expenses.forEach(({ cost, roommate_fkey: payer }) => {
    let splitAmount = cost / totalRoommates;
    
    roommates.forEach((roommate) => {
      if (roommate.id !== currentUser) {
        if (payer === currentUser) {
          // You paid, so they owe you their share
          balanceSheet[roommate.id] += splitAmount;
        } else if (roommate.id === payer) {
          // They paid, so you owe them your share
          balanceSheet[roommate.id] -= splitAmount;
        }
      }
    });
  });

  setBalances(balanceSheet); 
};

const ExpenseCard: React.FC<ExpensePeriodCard> = ({ id, open: current, start_date, end_date, expenses, updateExpenses, sessionState }) => {
  const { roommates, currentUser, session, refresh } = sessionState;

  const title = current
    ? "Current"
    : `${dateFormat(new Date(start_date))} to ${dateFormat(new Date(end_date))}`;

  const [expanded, setExpanded] = useState<boolean>(current);
  const [balances, setBalances] = useState<BalanceMap>({});

  const handleDeleteExpense = (expenseId: number) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            apiDeleteExpense(session, expenseId).then(() => {
              const updatedExpenses = expenses.filter((exp) => exp.id !== expenseId);
              updateExpenses(id, updatedExpenses);
            }).catch(error => {
              Toast.show({
                type: 'error',
                text1: 'Error Deleting Expense',
                text2: error.message || 'Failed to delete expense'
              });

              console.error(error);
            });
          }
        }
      ]
    );
  };

  useEffect(() => calculatePersonalBalances(expenses, setBalances, roommates, currentUser), [expenses]);

  const closeCurrentPeriod = () => {
    Alert.alert(
      'Close Expense Period',
      'Are you sure? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Close period',
          onPress: () => {
            apiCloseExpensePeriod(session).then(() => {
              refresh();
            }).catch(error => {
              Toast.show({
                type: 'error',
                text1: 'Error Closing Period',
                text2: error.message || 'Failed to close expense period'
              });
        
              console.error(error);
            });
          }
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.cardTitle}>{title}</Text>
        <MaterialIcons name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color="#007F5F" />
      </TouchableOpacity>

      {expanded && (
        <>
          {expenses.length === 0 ? (
            <Text style={styles.emptyText}>There are no expenses in the current period</Text>
          ) : (
            expenses.map(item => (
              <View key={item.id} style={styles.expenseRow}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{item.description}: ${item.cost.toFixed(2)}</Text>
                  <Text style={styles.expensePayer}>Paid by {(() => {
                      let roommate = roommates.find(roommate => roommate.id === item.roommate_fkey);
                      return roommate ? `${roommate.first_name} ${roommate.last_name}` : 'Unknown'
                    })()} on {dateFormat(new Date(item.created_at))}</Text>
                </View>
                { current && <TouchableOpacity 
                  onPress={() => handleDeleteExpense(item.id)}
                  style={styles.deleteButton}
                >
                  <MaterialIcons name="delete" size={24} color="#E57373" />
                </TouchableOpacity> }
              </View>
            ))
          )}
          
          {!current && Object.keys(balances).length > 0 && (
            <Text style={styles.balanceTitle}>Balances</Text>
          )}

          {!current && Object.keys(balances).length > 0 && (
            <View style={styles.balancesContainer}>
              {roommates
                .filter((roommate) => roommate.id !== currentUser) // Exclude the current user
                .map((roommate) => (
                  <View key={roommate.id} style={styles.balanceRow}>
                    <Text style={styles.roommateName}>{roommate.first_name} {roommate.last_name}:</Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        { color: balances[roommate.id] > 0 ? "#00D09E" : balances[roommate.id] < 0 ? "#E57373" : "#333" },
                      ]}
                    >
                      ${balances[roommate.id]?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                ))}
            </View>
          )}

          {current && expenses.length > 0 && (
            <TouchableOpacity style={styles.expenseCloseButton} onPress={closeCurrentPeriod}>
              <Text style={styles.expenseCloseButtonText}>Close expense period</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

export default function ExpensesScreen() {
  // auth
  const { session, userId } = useAuthContext();
  // expenses data
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [expensePeriods, setExpensePeriods] = useState<ExpensePeriod[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  // modal data
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState(userId);
  // main view data
  const [balances, setBalances] = useState<BalanceMap>({});
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get("window").height)).current;

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

  const fetchExpenses = async () => {
    if (!session) return;

    try {
      const expensesData = await apiGetExpenses(session);
      setExpensePeriods(expensesData.sort((a: ExpensePeriod, b: ExpensePeriod) => b.id - a.id));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Fetching Expenses',
        text2: error.message || 'Failed to fetch expenses'
      });
      console.error(error);
    }
  }

  const fetchAll = async () => {
    return Promise.all([
      fetchRoommates(),
      fetchExpenses(),
    ]);
  }

  useEffect(() => {fetchAll()}, [session]);

  // Function to update expenses for a specific card
  const updateExpenses = (id: number, updatedExpenses: Expense[]) => {
    setExpensePeriods((prevPeriods) =>
      prevPeriods.map((period) => (period.id === id ? { ...period, expenses: updatedExpenses } : period))
    );
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

  useEffect(() => calculatePersonalBalances(expensePeriods.find(period => period.open)?.expenses || [], setBalances, roommates, userId || 0), [expensePeriods]);

  const addExpense = () => {
    if (!description || !amount || !payerId) {
      Toast.show({
        type: 'error',
        text1: 'Error adding expense',
        text2: 'Must include description, cost, and responsible roommate'
      });
      return;
    }

    if (!RegExp(/^[0-9]+\.?[0-9]{0,2}$/).test(amount)) {
      Toast.show({
        type: 'error',
        text1: 'Error adding expense',
        text2: 'Expense amount must be numeric'
      });
      return;
    }

    apiCreateExpense(session, parseFloat(amount), description, payerId, roommates.map(roommate => {
      return {
        username: roommate.username,
        percentage: 1 / roommates.length
      }
    })).then(newExpense => {
      setExpensePeriods((prevPeriods) =>
        prevPeriods.map((period) => (period.open ? { ...period, expenses: [...period.expenses, newExpense] } : period))
      );

      setDescription("");
      setAmount("");
      setPayerId(userId);
      setModalVisible(false);
    }).catch(error => {
      Toast.show({
        type: 'error',
        text1: 'Error Adding Expense',
        text2: error.message || 'Failed to add expense'
      });

      console.error(error);
    });
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh}
          tintColor="#00D09E" colors={["#00D09E"]} />}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Your Current Balance</Text>
        </View>
        
        <View style={styles.balanceCard}>
          {roommates
            .filter((roommate) => roommate.id !== userId) // Exclude the current user
            .map((roommate) => (
              <View key={roommate.id} style={styles.balanceRow}>
                <Text style={styles.roommateName}>{roommate.first_name} {roommate.last_name}:</Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    { color: balances[roommate.id] > 0 ? "#00D09E" : balances[roommate.id] < 0 ? "#E57373" : "#333" },
                  ]}
                >
                  ${balances[roommate.id]?.toFixed(2) || "0.00"}
                </Text>
              </View>
            ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Expense Periods</Text>
        </View>

        {expensePeriods.map((period) => (
          <ExpenseCard key={period.id} id={period.id} open={period.open} start_date={period.start_date}
            end_date={period.end_date} expenses={period.expenses} updateExpenses={updateExpenses}
            sessionState={{ roommates, currentUser: userId || 0, session, refresh }} />
        ))}

        <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1 }}
          >
            <TouchableOpacity 
              style={styles.modalContainer} 
              activeOpacity={1} 
              onPress={() => setModalVisible(false)}
            >
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
              >
                <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
                  <Text style={styles.modalTitle}>Add Expense</Text>
                  <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
                  <TextInput style={styles.input} placeholder="Cost" keyboardType="numeric" value={amount} onChangeText={setAmount} />
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
                        onPress={() => setPayerId(roommate.id)}
                        style={[
                          styles.roommateOption,
                          payerId === roommate.id && styles.selectedRoommateOption
                        ]}
                      >
                        <View style={styles.roommateAvatar}>
                          <Text style={styles.roommateAvatarText}>
                            {`${roommate.first_name.charAt(0)}${roommate.last_name.charAt(0)}`}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.roommateSelectName,
                            payerId === roommate.id && styles.selectedRoommateName
                          ]}
                        >
                          {roommate.id === userId ? "You" : roommate.first_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity style={styles.submitButton} onPress={addExpense}>
                    <Text style={styles.submitButtonText}>Save Expense</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </Animated.View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
      
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#FFFFFF" 
  },
  sectionHeader: { 
    backgroundColor: "#FFFFFF", 
    paddingVertical: 10, 
    paddingHorizontal: 0,
    marginBottom: 5
  },
  sectionHeaderText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#007F5F" 
  },
  balanceCard: { 
    backgroundColor: "#DFF7E280", 
    borderRadius: 12, 
    padding: 15, 
    marginBottom: 20 
  },
  card: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: { 
    fontSize: 17, 
    fontWeight: "bold", 
    color: "#007F5F"
  },
  cardHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 8 
  },
  balancesContainer: { 
    marginTop: 10 
  },
  balanceTitle: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#007F5F", 
    marginTop: 15,
    marginBottom: 5
  },
  balanceRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  roommateName: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#333" 
  },
  balanceAmount: { 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  expenseRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    padding: 12, 
    borderBottomWidth: 1, 
    borderColor: "#F0F0F0",
    alignItems: "center"
  },
  expenseInfo: { 
    flex: 1 
  },
  expenseDescription: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333",
    marginBottom: 4
  },
  expensePayer: { 
    fontSize: 14, 
    color: "#666" 
  },
  deleteButton: {
    padding: 8,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#007F5F", 
    marginBottom: 15 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: "flex-end", 
    backgroundColor: "rgba(0, 0, 0, 0.5)" 
  },
  modalContent: { 
    backgroundColor: "#FFFFFF", 
    padding: 20, 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#CCC", 
    borderRadius: 8, 
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "#333"
  },
  submitButton: { 
    backgroundColor: "#00D09E", 
    paddingVertical: 15,
    paddingHorizontal: 10, 
    borderRadius: 8, 
    alignItems: "center",
    marginTop: 5
  },
  submitButtonText: { 
    color: "#FFFFFF", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  closeButton: { 
    alignItems: "center", 
    paddingVertical: 12,
    marginTop: 5
  },
  closeButtonText: { 
    fontSize: 16, 
    color: "#007FFF", 
    fontWeight: "bold" 
  },
  expenseCloseButton: { 
    alignSelf: "center", 
    marginTop: 20, 
    marginBottom: 10,
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    backgroundColor: "#00D09E", 
    borderRadius: 12 
  },
  expenseCloseButtonText: { 
    color: "#FFFFFF", 
    fontSize: 16,
    fontWeight: "bold" 
  },
  fab: { 
    position: "absolute", 
    bottom: 20, 
    right: 20, 
    flexDirection: "row", 
    backgroundColor: "#00D09E", 
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: { 
    color: "#FFFFFF", 
    fontWeight: "bold", 
    marginLeft: 8, 
    fontSize: 16
  },
  label: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#007F5F", 
    marginBottom: 8 
  },
  roommateScrollContainer: { 
    paddingBottom: 15,
  },
  roommateOption: { 
    alignItems: 'center', 
    marginRight: 15, 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#EEE', 
    minWidth: 100 
  },
  selectedRoommateOption: { 
    backgroundColor: '#00D09E', 
    borderColor: '#00D09E' 
  },
  roommateAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#CDEEEE', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  roommateAvatarText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#007F5F' 
  },
  roommateSelectName: { 
    fontSize: 14, 
    color: '#333', 
    textAlign: 'center' 
  },
  selectedRoommateName: { 
    color: '#FFFFFF' 
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 15,
  },
});
