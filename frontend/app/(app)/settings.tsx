import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
import { useAuthContext } from '@/contexts/AuthContext';
import { apiLeaveRoom, apiGetProfilePicture, apiUpdateProfilePicture } from "@/utils/api/apiClient";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

export default function SettingsScreen() {
  const { session, signOut, userId } = useAuthContext(); // Assuming userId is available in the AuthContext
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const defaultAvatar = require("@/assets/images/default_profile.png"); // Fallback image

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!session || !userId) return;

      setIsLoading(true);
      try {
        const blob = await apiGetProfilePicture(session, userId); // Pass userId as a parameter
        const imageUrl = URL.createObjectURL(blob);
        setProfileImage(imageUrl);
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch profile picture. Please try again later.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileImage();
  }, [session, userId]);

  const handleLeaveRoom = async () => {
    Alert.alert(
      "Leave Room",
      "Are you sure? All your chores will be deleted.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await apiLeaveRoom(session);
              router.replace("/room-landing");
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to leave the room.'
              });
            }
          }
        }
      ]
    );
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      
      try {
        await apiUpdateProfilePicture(session, imageUri);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile picture updated successfully.'
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to update profile picture. Please try again later.'
        });
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
      <TouchableOpacity onPress={pickImage} style={styles.profileButton}>
        <Image 
          source={profileImage ? { uri: profileImage } : defaultAvatar} 
          style={styles.profileImage} 
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLeaveRoom}>
        <Text style={styles.buttonText}>Leave Room</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00D09E",
  },
  profileButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 15,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  button: {
    width: 200,
    paddingVertical: 10,
    backgroundColor: "#00D09E",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});