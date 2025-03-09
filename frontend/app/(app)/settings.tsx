import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
//import ImagePicker from 'react-native-image-picker';
import {launchImageLibrary, MediaType, PhotoQuality } from 'react-native-image-picker'; // Import ImagePicker
import { useState, useEffect } from "react";
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiLeaveRoom, apiGetProfilePicture, apiUpdateProfilePicture } from "@/utils/api/apiClient";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import defaultAvatar from "@/assets/images/default_profile.png"; // Default avatar

export default function SettingsScreen() {
  const { session, signOut, userId } = useAuthContext(); // Assuming userId is available in the AuthContext
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!session || !userId) return;

      setIsLoading(true);
      try {
        const response = await apiGetProfilePicture(session, userId);

        if (typeof response === 'string') {
          let base64Image = response;

          // Remove redundant prefixes like "dataimage/jpegbase64"
          if (base64Image.includes('dataimage/jpegbase64')) {
            base64Image = base64Image.replace('dataimage/jpegbase64', '');
          }

          // Add the correct prefix if missing
          if (!base64Image.startsWith('data:image/jpeg;base64,')) {
            base64Image = `data:image/jpeg;base64,${base64Image}`;
          }

          setProfileImage(base64Image);
        } else {
          console.log('No profile picture found or invalid data:', response);
          setProfileImage(null); // Use default avatar
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch profile picture. Please try again later.'
        });
        setProfileImage(null); // Set to null on error
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

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, // For Android 13+
          {
            title: 'Storage Permission',
            message: 'App needs access to your photos to upload images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        console.log("Permission result:", granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn("Permission error:", err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const pickImage = () => {
    const options = {
      title: 'Select Profile Picture',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
      mediaType: 'photo' as MediaType,
      maxWidth: 500,
      maxHeight: 500,
      quality: 1 as PhotoQuality,
    };

    console.log("Opening image picker...");
    launchImageLibrary(options, async (response) => {
      console.log("Image picker response:", response);
      if (response.didCancel) {
        console.log('User cancelled image picker');
        Alert.alert('You did not select any image');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to pick an image.');
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        console.log("Image selected:", imageUri);
        setProfileImage(imageUri);
  
        try {
          await apiUpdateProfilePicture(session, imageUri);
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Profile picture updated successfully.',
          });
        } catch (error) {
          console.log("API update error:", error);
          Alert.alert("Error", "Failed to update profile picture. Please try again later.");
        }
      }
    });
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