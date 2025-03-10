import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  apiLeaveRoom,
  apiGetProfilePicture,
  apiUpdateProfilePicture,
  apiGetRoommates,
  apiUpdateUserInfo,
} from '@/utils/api/apiClient';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import defaultAvatar from '@/assets/images/default_profile.png'; //default avatar
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { session, signOut, userId } = useAuthContext();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [showEditNameModal, setShowEditNameModal] = useState<boolean>(false);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');

  // Optimize profile image loading with useCallback
  const fetchProfileImage = useCallback(async () => {
    if (!session || !userId) return;

    setIsImageLoading(true);
    try {
      const response = await apiGetProfilePicture(session, userId.toString());

      if (typeof response === 'string') {
        setProfileImage(response);
      } else {
        setProfileImage(null); //use default avatar
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch profile picture.',
      });
      setProfileImage(null); //set to null on error
    } finally {
      setIsImageLoading(false);
      setIsLoading(false);
    }
  }, [session, userId]);

  // Optimize roommates data fetching with useCallback
  const fetchRoommates = useCallback(async () => {
    if (!session) return;
    try {
      const roommatesData = await apiGetRoommates(session);
      const currentUser = roommatesData.find(
        (roommate: any) => roommate.id === userId,
      );
      if (currentUser) {
        setFirstName(currentUser.first_name);
        setLastName(currentUser.last_name);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    }
  }, [session, userId]);

  // Effects to load data
  useEffect(() => {
    fetchProfileImage();
  }, [fetchProfileImage]);

  useEffect(() => {
    fetchRoommates();
  }, [fetchRoommates]);

  const handleLeaveRoom = async () => {
    Alert.alert(
      'Leave Room',
      'Are you sure? All your chores will be deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiLeaveRoom(session);
              router.replace('/room-landing');
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to leave the room.',
              });
            }
          },
        },
      ],
    );
  };

  const handleEditName = () => {
    setEditFirstName(firstName);
    setEditLastName(lastName);
    setShowEditNameModal(true);
  };

  const handleSaveName = async () => {
    if (!editFirstName.trim() || !editLastName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'First name and last name cannot be empty.',
      });
      return;
    }

    try {
      await apiUpdateUserInfo(session, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
      });

      setFirstName(editFirstName.trim());
      setLastName(editLastName.trim());
      setShowEditNameModal(false);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Name updated successfully!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update name. Please try again.',
      });
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true, // Ensure the image is converted to base64
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setIsImageLoading(true);

      // Convert to base64 if needed by the API
      try {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const base64Image = `data:image/jpeg;base64,${base64}`;

        // Update UI immediately
        setProfileImage(base64Image);

        // Update the server
        await apiUpdateProfilePicture(session, base64Image);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile picture updated successfully!',
        });
      } catch (error: any) {
        console.error('API error:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update profile picture. Please try again later.',
        });
      } finally {
        setIsImageLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.nameSection}>
          <Text style={styles.name}>
            {firstName} {lastName}
          </Text>
          <TouchableOpacity onPress={handleEditName} style={styles.editButton}>
            <Ionicons name="pencil" size={18} color="#00D09E" />
          </TouchableOpacity>
        </View>
        <View style={styles.spacer} />
        <TouchableOpacity onPress={pickImage} style={styles.profileButton}>
          {isImageLoading ? (
            <View style={[styles.profileImage, styles.loadingContainer]}>
              <ActivityIndicator size="large" color="#00D09E" />
            </View>
          ) : (
            <Image
              source={profileImage ? { uri: profileImage } : defaultAvatar}
              style={styles.profileImage}
              fadeDuration={100}
              onError={(e) => {
                console.log('Image loading error:', e.nativeEvent.error);
                setProfileImage(null); // Fallback to default avatar
              }}
            />
          )}
        </TouchableOpacity>
        <Text style={styles.tapHint}>Tap to change</Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.button} onPress={handleLeaveRoom}>
          <Text style={styles.buttonText}>Leave Room</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={editFirstName}
              onChangeText={setEditFirstName}
              placeholder="First Name"
            />

            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={editLastName}
              onChangeText={setEditLastName}
              placeholder="Last Name"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditNameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 40,
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00D09E',
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    padding: 5,
    marginLeft: 8,
  },
  profileButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 10,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 15,
  },
  tapHint: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
  },
  button: {
    width: 200,
    paddingVertical: 10,
    backgroundColor: '#00D09E',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  spacer: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#00D09E',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#00D09E',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
