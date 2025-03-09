import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, ScrollView } from "react-native";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiGetRoom, apiGetRoommates, apiGetProfilePicture } from "@/utils/api/apiClient";
import Toast from "react-native-toast-message";

interface RoomData {
  room_id: number | null;
  name: string | null;
  invite_code: string | null;
}

interface Roommate {
  id: number;
  first_name: string;
  last_name: string;
  avatar: string | null; //updated to include avatar
}

export default function HomeScreen() {
  const { session, sessionLoading } = useAuthContext();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;

      try {
        //fetch room data
        const room = await apiGetRoom(session);
        setRoomData(room);

        //fetch roommates
        await fetchRoommates();
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [session]);

  const fetchRoommates = async () => {
    if (!session) return;

    try {
      const roommatesData = await apiGetRoommates(session);

      //fetch profile pictures for each roommate
      const roommatesWithAvatars = await Promise.all(
        roommatesData.map(async (roommate: any) => {
          let avatar = defaultAvatar; // Default avatar as fallback

          try {
            const profilePicture = await apiGetProfilePicture(session, roommate.id);

            //format the base64 string if it's valid
            if (typeof profilePicture === "string") {
              let base64Image = profilePicture;

              //remove redundant prefixes like "dataimage/jpegbase64"
              if (base64Image.includes("dataimage/jpegbase64")) {
                base64Image = base64Image.replace("dataimage/jpegbase64", "");
              }

              //add the correct prefix if missing
              if (!base64Image.startsWith("data:image/jpeg;base64,")) {
                base64Image = `data:image/jpeg;base64,${base64Image}`;
              }

              avatar = base64Image;
            }
          } catch (error) {
            console.error("Error fetching profile picture for roommate:", roommate.id, error);
          }

          return {
            id: roommate.id,
            first_name: roommate.first_name,
            last_name: roommate.last_name,
            avatar: avatar, //set the avatar (either base64 or default)
          };
        })
      );

      setRoommates(roommatesWithAvatars);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error Fetching Roommates",
        text2: error.message || "Failed to fetch roommates",
      });
    }
  };

  if (sessionLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Welcome Message */}
        {roomData && roomData.room_id ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <Text style={styles.roomName}>{roomData.name}</Text>
            <Text style={styles.welcomeSubtitle}>Your shared living space</Text>
          </View>
        ) : (
          <Text style={styles.noRoom}>You are not in a room yet</Text>
        )}

        {/* Room Code */}
        {roomData?.invite_code && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Room Code</Text>
            <Text style={styles.joinCode}>{roomData.invite_code}</Text>
          </View>
        )}

        {/* Roommates */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Roommates</Text>
          <FlatList
            data={roommates}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.roommateList}
            renderItem={({ item }) => (
              <View style={styles.roommateContainer}>
                <Image
                  source={{ uri: item.avatar || defaultAvatar }} //use default avatar if avatar is null
                  style={styles.avatar}
                  onError={(e) => {
                    console.log("Image loading error:", e.nativeEvent.error);
                    //fallback to default avatar if the image fails to load
                    item.avatar = defaultAvatar;
                  }}
                />
                <Text style={styles.roommate}>
                  {item.first_name} {item.last_name}
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  welcomeContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#00D09E",
    textAlign: "center",
  },
  roomName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#007F5F",
    textAlign: "center",
    marginVertical: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  noRoom: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
  },
  card: {
    backgroundColor: "#DFF7E280",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007F5F",
    marginBottom: 10,
  },
  joinCode: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#E0F7F5",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    width: "100%",
  },
  roommateList: {
    justifyContent: "center",
    alignItems: "center",
  },
  roommateContainer: {
    alignItems: "center",
    margin: 10,
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: 120,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  roommate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
});