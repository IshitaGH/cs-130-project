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

interface Expense {
  id: number;
  description: string;
  amount: number;
  payer: string;
  date: string;
}

interface ExpenseCardProps {
  title: string;
  current: boolean;
  expenses: Expense[];
  updateExpenses: (title: string, updatedExpenses: Expense[]) => void;
}

interface BalanceMap {
  [key: string]: number
}

const CURRENT_USER = "Caolinn"; //replace this with an API call when ready

const initialMockExpenses = [
  {
    title: "Current period expenses",
    current: true,
    expenses: [
      { id: 4, description: "Groceries", amount: 50, payer: "Byron", date: new Date().toLocaleDateString() },
      { id: 3, description: "Electric Bill", amount: 30, payer: "Claire", date: new Date().toLocaleDateString() },
    ]
  },
  {
    title: "Jan 10 to Feb 10 expenses",
    current: false,
    expenses: [
      { id: 2, description: "Rent", amount: 4000, payer: "Nik", date: new Date(2025, 0, 29).toLocaleDateString() },
      { id: 1, description: "Internet", amount: 30, payer: "Ishita", date: new Date(2025, 0, 23).toLocaleDateString() },
    ]
  }
];

const roommates = ["Byron", "Claire", "Nira", "Nik", "Caolinn", "Ishita"];

const calculatePersonalBalances = (expenses, setBalances) => {
  let balanceSheet: BalanceMap = {};
  roommates.forEach((roommate) => (balanceSheet[roommate] = 0));
  let totalRoommates = roommates.length;

  expenses.forEach(({ amount, payer }) => {
    let splitAmount = amount / totalRoommates;
    
    roommates.forEach((roommate) => {
      if (roommate !== CURRENT_USER) {
        if (payer === CURRENT_USER) {
          // You paid, so they owe you their share
          balanceSheet[roommate] += splitAmount;
        } else if (roommate === payer) {
          // They paid, so you owe them your share
          balanceSheet[roommate] -= splitAmount;
        }
      }
    });
  });

  setBalances(balanceSheet); 
};

const ExpenseCard: React.FC<ExpenseCardProps> = ({ title, current, expenses, updateExpenses }) => {
  const [expanded, setExpanded] = useState<boolean>(current);
  const [balances, setBalances] = useState<BalanceMap>({});

  const handleDeleteExpense = (expenseId: number) => {
    const updatedExpenses = expenses.filter((exp) => exp.id !== expenseId);
    updateExpenses(title, updatedExpenses);
  };

  if (!current) {
    useEffect(() => calculatePersonalBalances(expenses, setBalances), [expenses]);
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
                  <Text style={styles.expenseDescription}>{item.description}: ${item.amount}</Text>
                  <Text style={styles.expensePayer}>Paid by {item.payer} on {item.date}</Text>
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
                .filter((name) => name !== CURRENT_USER) // Exclude the current user
                .map((name) => (
                  <View key={name} style={styles.balanceRow}>
                    <Text style={styles.roommateName}>{name}:</Text>
                    <Text
                      style={[
                        styles.balanceAmount,
                        { color: balances[name] > 0 ? "#00D09E" : balances[name] < 0 ? "#E57373" : "#333" },
                      ]}
                    >
                      ${balances[name]?.toFixed(2) || "0.00"}
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
  const [expenseCards, setExpenseCards] = useState<{ title: string; current: Boolean; expenses: Expense[] }[]>([...initialMockExpenses]);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(roommates[0]);
  const [balances, setBalances] = useState<BalanceMap>({});
  const slideAnim = React.useRef(new Animated.Value(Dimensions.get("window").height)).current;

  // Function to update expenses for a specific card
  const updateExpenses = (title: string, updatedExpenses: Expense[]) => {
    setExpenseCards((prevCards) =>
      prevCards.map((card) => (card.title === title ? { ...card, expenses: updatedExpenses } : card))
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

  useEffect(() => calculatePersonalBalances(expenseCards[0].expenses, setBalances), [expenseCards[0].expenses]);

  const addExpense = () => {
    if (!description || !amount || !payer) return;
    const newExpense = {
      id: Math.random(),
      description,
      amount: parseFloat(amount),
      payer,
      date: new Date().toLocaleDateString(),
    };

    setExpenseCards((prevCards) =>
      prevCards.map((card) => (card.current ? { ...card, expenses: [newExpense, ...card.expenses] } : card))
    );

    // setExpenses([...expenses, newExpense]);
    setDescription("");
    setAmount("");
    setPayer(roommates[0]);
    setModalVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current period balances</Text>
          {roommates
            .filter((name) => name !== CURRENT_USER) // Exclude the current user
            .map((name) => (
              <View key={name} style={styles.balanceRow}>
                <Text style={styles.roommateName}>{name}:</Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    { color: balances[name] > 0 ? "#00D09E" : balances[name] < 0 ? "#E57373" : "#333" },
                  ]}
                >
                  ${balances[name]?.toFixed(2) || "0.00"}
                </Text>
              </View>
            ))}
        </View>

        {expenseCards.map((card) => (
          <ExpenseCard key={card.title} title={card.title} current={card.current} expenses={card.expenses} updateExpenses={updateExpenses} />
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
                  <Picker.Item key={roommate} label={roommate} value={roommate} />
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
