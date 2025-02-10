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
  Picker,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const initialMockExpenses = [
  { id: "1", description: "Groceries", amount: 50, payer: "Byron", date: new Date().toLocaleDateString() },
  { id: "2", description: "Electric Bill", amount: 30, payer: "Claire", date: new Date().toLocaleDateString() },
];

const roommates = ["Byron", "Claire", "Nira", "Nik", "Caolinn", "Ishita"];

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([...initialMockExpenses]);
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(roommates[0]);
  const [balances, setBalances] = useState({});
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
    calculateBalances();
  }, [expenses]);

  const calculateBalances = () => {
    let balanceSheet = {};
    roommates.forEach((roommate) => (balanceSheet[roommate] = 0));
    let totalRoommates = roommates.length;

    expenses.forEach(({ amount, payer }) => {
      let splitAmount = amount / totalRoommates;
      roommates.forEach((roommate) => {
        if (roommate === payer) {
          balanceSheet[roommate] += amount - splitAmount;
        } else {
          balanceSheet[roommate] -= splitAmount;
        }
      });
    });
    setBalances(balanceSheet);
  };

  const addExpense = () => {
    if (!description || !amount || !payer) return;
    const newExpense = {
      id: Math.random().toString(),
      description,
      amount: parseFloat(amount),
      payer,
      date: new Date().toLocaleDateString(),
    };
    setExpenses([...expenses, newExpense]);
    setDescription("");
    setAmount("");
    setPayer(roommates[0]);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Balances</Text>
        {roommates.map((name) => (
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Expenses</Text>
        <FlatList
          data={expenses}
          renderItem={({ item }) => (
            <View style={styles.expenseRow}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseDescription}>{item.description} - ${item.amount}</Text>
                <Text style={styles.expensePayer}>Paid by: {item.payer} on {item.date}</Text>
              </View>
              <TouchableOpacity onPress={() => setExpenses(expenses.filter(exp => exp.id !== item.id))}>
                <MaterialIcons name="delete" size={24} color="#E57373" />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialIcons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Expense</Text>
      </TouchableOpacity>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFFFFF" },
  card: { backgroundColor: "#DFF7E280", borderRadius: 12, padding: 15, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#007F5F", marginBottom: 10 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  roommateName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  balanceAmount: { fontSize: 16, fontWeight: "bold" },
  expenseRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderColor: "#DDD" },
  expenseInfo: { flex: 1 },
  expenseDescription: { fontSize: 16, fontWeight: "bold", color: "#333" },
  expensePayer: { fontSize: 14, color: "#666" },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { backgroundColor: "#FFFFFF", padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  input: { borderWidth: 1, borderColor: "#CCC", borderRadius: 8, padding: 10, marginBottom: 15 },
  submitButton: { backgroundColor: "#00D09E", padding: 10, borderRadius: 8, alignItems: "center" },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  closeButton: { alignItems: "center", paddingVertical: 10 },
  closeButtonText: { fontSize: 16, color: "#007FFF", fontWeight: "bold" },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A680",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    position: "absolute",
    bottom: 20,
    right: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", marginLeft: 8 },
});
