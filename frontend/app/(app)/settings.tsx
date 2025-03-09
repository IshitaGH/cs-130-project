import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useState, useEffect } from "react";
import { useAuthContext } from '@/contexts/AuthContext';
import { apiLeaveRoom, apiGetProfilePicture, apiUpdateProfilePicture } from "@/utils/api/apiClient";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import defaultAvatar from "@/assets/images/default_profile.png"; //default avatar

export default function SettingsScreen() {
  const { session, signOut, userId } = useAuthContext(); //assuming userId is available in the AuthContext
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!session || !userId) return;
  
      setIsLoading(true);
      try {
        const response = await apiGetProfilePicture(session, userId.toString());
  
        if (typeof response === 'string') {
          let base64Image = response;
  
          //remove redundant prefixes like "dataimage/jpegbase64"
          if (base64Image.includes('dataimage/jpegbase64')) {
            base64Image = base64Image.replace('dataimage/jpegbase64', '');
          }
  
          //add the correct prefix if missing
          if (!base64Image.startsWith('data:image/jpeg;base64,')) {
            base64Image = `data:image/jpeg;base64,${base64Image}`;
          }
  
          setProfileImage(base64Image);
        } else {
          console.log('No profile picture found or invalid data:', response);
          setProfileImage(null); //use default avatar
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch profile picture. Please try again later.'
        });
        setProfileImage(null); //set to null on error
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
            } catch (error: any) {
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
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true, // Ensure the image is converted to base64
    });
  
    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
  
      // Convert to base64 if needed by the API
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      const base64Image = `data:image/jpeg;base64,${base64}`;
  
      setProfileImage(base64Image);
  
      try {
        const response = await apiUpdateProfilePicture(session, base64Image); // Send base64 instead of URI
        console.log("API Response:", response);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile picture updated successfully.'
        });
      } catch (error: any) {
        console.error("API error:", error);
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
        onError={(e) => {
          console.log('Image loading error:', e.nativeEvent.error);
          setProfileImage(null); // Fallback to default avatar
        }}
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