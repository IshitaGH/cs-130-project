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
} from "react-native";
import { Picker } from '@react-native-picker/picker'
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiCreateExpense, apiDeleteExpense, apiGetExpenses, apiGetRoom, apiGetRoommates } from "@/utils/api/apiClient";

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

const dateFormat = new Intl.DateTimeFormat('en-US').format;

const CURRENT_USER = "Caolinn"; //replace this with an API call when ready

const initialMockExpenses = [
  {
    title: "Current period expenses",
    open: true,
    expenses: [
      { id: 4, description: "Groceries", cost: 50, payer: "Byron", date: new Date().toLocaleDateString() },
      { id: 3, description: "Electric Bill", cost: 30, payer: "Claire", date: new Date().toLocaleDateString() },
    ]
  },
  {
    title: "Jan 10 to Feb 10 expenses",
    open: false,
    expenses: [
      { id: 2, description: "Rent", cost: 4000, payer: "Nik", date: new Date(2025, 0, 29).toLocaleDateString() },
      { id: 1, description: "Internet", cost: 30, payer: "Ishita", date: new Date(2025, 0, 23).toLocaleDateString() },
    ]
  }
];

const roommates_mock = ["Byron", "Claire", "Nira", "Nik", "Caolinn", "Ishita"];

const calculatePersonalBalances = (expenses: Expense[], setBalances: any, roommates: Roommate[], currentUser: number) => {
  let balanceSheet: BalanceMap = {};
  // roommates_mock.forEach((roommate) => (balanceSheet[roommate] = 0));
  roommates.forEach(roommate => { balanceSheet[roommate.id] = 0 });
  // let totalRoommates = roommates_mock.length;
  let totalRoommates = roommates.length;

  expenses.forEach(({ cost, roommate_fkey: payer }) => {
    let splitAmount = cost / totalRoommates;
    
    // roommates_mock.forEach((roommate) => {
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
  const { roommates, currentUser, session } = sessionState;

  const title = current
    ? "Current period expenses"
    : `${dateFormat(new Date(start_date))} to ${dateFormat(new Date(end_date))}`;

  const [expanded, setExpanded] = useState<boolean>(current);
  const [balances, setBalances] = useState<BalanceMap>({});

  const handleDeleteExpense = (expenseId: number) => {
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
  };

  if (!current) {
    useEffect(() => calculatePersonalBalances(expenses, setBalances, roommates, currentUser), [expenses]);
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(!expanded)}>
        <Text style={styles.cardTitle}>{title}</Text>
        <MaterialIcons name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color="black" />
      </TouchableOpacity>

      {expanded && (
        <>
          <FlatList
            data={expenses}
            renderItem={({ item }) => (
              <View style={styles.expenseRow}>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDescription}>{item.description}: ${item.cost.toFixed(2)}</Text>
                  <Text style={styles.expensePayer}>Paid by {(() => {
                      let roommate = roommates.find(roommate => roommate.id === item.roommate_fkey);
                      return roommate ? `${roommate.first_name} ${roommate.last_name}` : 'Unknown'
                    })()} on {dateFormat(new Date(item.created_at))}</Text>
                </View>
                { current && <TouchableOpacity onPress={() => handleDeleteExpense(item.id)}>
                  <MaterialIcons name="delete" size={24} color="#E57373" />
                </TouchableOpacity> }
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
          
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

          {current && (
            <TouchableOpacity style={styles.expenseCloseButton} onPress={() => setExpanded(false)}>
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
  // modal data
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  // main view data
  const [balances, setBalances] = useState<BalanceMap>({});
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
      setExpensePeriods(expensesData);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error Fetching Expenses',
        text2: error.message || 'Failed to fetch expenses'
      });
      console.error(error);
    }
  }

  useEffect(() => {
    fetchRoommates();
    fetchExpenses();
  }, [session]);

  // Function to update expenses for a specific card
  const updateExpenses = (id: number, updatedExpenses: Expense[]) => {
    setExpensePeriods((prevCards) =>
      prevCards.map((card) => (card.id === id ? { ...card, expenses: updatedExpenses } : card))
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
    if (!description || !amount /* || !payer */) return; // TODO: add validation

    apiCreateExpense(session, parseFloat(amount), description, roommates.map(roommate => {
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
      setPayer(""); // TODO: update to be current user
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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current period balances</Text>
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

        {expensePeriods.map((period) => (
          <ExpenseCard key={period.id} id={period.id} open={period.open} start_date={period.start_date}
            end_date={period.end_date} expenses={period.expenses} updateExpenses={updateExpenses}
            sessionState={{ roommates, currentUser: userId || 0, session }} />
        ))}

        <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
            <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
              <TextInput style={styles.input} placeholder="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
              <Picker
                selectedValue={payer}
                onValueChange={(itemValue) => setPayer(itemValue)}
                style={styles.input}
              >
                {roommates.map((roommate) => (
                  <Picker.Item key={roommate.username} label={`${roommate.first_name} ${roommate.last_name}`} value={roommate.username} />
                ))}
              </Picker>
              <TouchableOpacity style={styles.submitButton} onPress={addExpense}>
                <Text style={styles.submitButtonText}>Save Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
      
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'scroll', padding: 20, backgroundColor: "#FFFFFF" },
  card: { backgroundColor: "#DFF7E280", borderRadius: 12, padding: 15, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  balancesContainer: { margin: 15 },
  balanceTitle: { fontSize: 18, fontWeight: "bold", color: "#007F5F", marginTop: 25 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  roommateName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  balanceAmount: { fontSize: 16, fontWeight: "bold" },
  expenseRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderColor: "#DDD" },
  expenseInfo: { flex: 1 },
  expenseDescription: { fontSize: 16, fontWeight: "bold", color: "#333" },
  expensePayer: { fontSize: 14, color: "#666" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { backgroundColor: "#FFFFFF", padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  input: { borderWidth: 1, borderColor: "#CCC", borderRadius: 8, padding: 10, marginBottom: 15 },
  submitButton: { backgroundColor: "#00D09E", padding: 10, borderRadius: 8, alignItems: "center" },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  closeButton: { alignItems: "center", paddingVertical: 10 },
  closeButtonText: { fontSize: 16, color: "#007FFF", fontWeight: "bold" },
  expenseCloseButton: { alignSelf: "center", marginTop: 30, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#00D09E", padding: 10, borderRadius: 12 },
  expenseCloseButtonText: { color: "#FFFFFF", fontWeight: "bold" },
  fab: { position: "absolute", bottom: 20, right: 20, flexDirection: "row", backgroundColor: "#00D09E", padding: 10, borderRadius: 12 },
  fabText: { color: "#FFFFFF", fontWeight: "bold", marginLeft: 8, alignSelf: "center" },
});
