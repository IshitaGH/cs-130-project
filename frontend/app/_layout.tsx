import { SessionProvider } from '@/contexts/AuthContext';
import { Slot } from 'expo-router';
import Toast from 'react-native-toast-message';
import { View, Text, StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <SessionProvider>
      <Slot />
      <Toast config={toastConfig} />
    </SessionProvider>
  );
}

const toastConfig = {
  success: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={styles.toastContainer}>
      <Text style={styles.toastText}>{text1}</Text>
      <Text style={styles.toastSubText}>{text2}</Text>
    </View>
  ),
  error: ({ text1, text2 }: { text1?: string; text2?: string }) => (
    <View style={styles.toastContainer}>
      <Text style={styles.toastText}>{text1}</Text>
      <Text style={styles.toastSubText}>{text2}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    width: '80%',
    alignSelf: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toastSubText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
