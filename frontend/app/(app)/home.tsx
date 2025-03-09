import React, { useEffect, useState } from "react";
import { RefreshControl, View, Text, StyleSheet, ScrollView, FlatList, Image, Dimensions} from "react-native";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiGetRoom, apiGetRoommates, apiGetProfilePicture } from "@/utils/api/apiClient";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

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
  const { session, sessionLoading, userId } = useAuthContext();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  useEffect(() => {
    fetchData();
  }, [session]);

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
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch roommate data"
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchRoommates = async () => {
    if (!session) return;

    try {
      const roommatesData = await apiGetRoommates(session);

      //fetch profile pictures for each roommate
      const roommatesWithAvatars = await Promise.all(
        roommatesData
          .filter((roommate: any) => roommate.id !== userId) // Filter out the current user
          .map(async (roommate: any) => {
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
    <View style={styles.container}>
      {/* Welcome Message */}
      <View style={styles.headerContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome to Roomies!</Text>
          <Text style={styles.welcomeSubtitle}>
            {roomData && roomData.room_id 
              ? "Your shared living space" 
              : "You are not in a room yet"}
          </Text>
        </View>

        {/* Room Card */}
        {roomData?.invite_code && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="home" size={22} color="#007F5F" />
              <Text style={styles.cardTitle}>Your Room</Text>
            </View>
            <Text style={styles.roomName}>{roomData.name}</Text>
            <View style={styles.divider} />
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Invite Code:</Text>
              <Text style={styles.joinCode}>{roomData.invite_code}</Text>
            </View>
          </View>
        )}

        {/* Roommates Section */}
        <View style={[styles.card, styles.roommatesCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={22} color="#007F5F" />
            <Text style={styles.cardTitle}>Your Roommates</Text>
          </View>
          
          {roommates.length > 0 ? (
            <View style={styles.roommatesContainer}>
              <ScrollView 
                style={styles.roommatesScrollView}
                contentContainerStyle={[
                  styles.roommatesScrollContent,
                  { paddingTop: 10 } // Add some padding at the top for the refresh control
                ]}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#00D09E"
                    colors={["#00D09E"]}
                    progressViewOffset={10} // Add some offset for better visibility
                  />
                }
              >
                <View style={styles.roommatesGrid}>
                  {roommates.map(item => (
                    <View key={item.id.toString()} style={styles.roommateContainer}>
                      <View style={styles.avatarContainer}>
                        <Image
                          source={{ uri: item.avatar || defaultAvatar }}
                          style={styles.avatar}
                          onError={(e) => {
                            console.log("Image loading error:", e.nativeEvent.error);
                          }}
                        />
                      </View>
                      <Text style={styles.roommate} numberOfLines={1} ellipsizeMode="tail">
                        {item.first_name} {item.last_name}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No roommates found</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 10,
    height: '100%',
  },
  welcomeContainer: {
    marginBottom: 44,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007F5F",
    textAlign: "center",
    marginBottom: 6,
  },
  roomName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginVertical: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  card: {
    backgroundColor: "#DFF7E280",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roommatesCard: {
    flex: 1,
    marginBottom: 20,
    maxHeight: '50%',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007F5F",
    marginLeft: 8,
  },
  codeContainer: {
    alignItems: "center",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#D0E8D5",
    width: "80%",
    alignSelf: "center",
    marginVertical: 8,
  },
  joinCode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
  },
  codeLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
    textAlign: "center",
  },
  roommatesContainer: {
    flex: 1,
  },
  roommatesScrollView: {
    flex: 1,
  },
  roommatesScrollContent: {
    paddingVertical: 5,
  },
  roommatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  roommateContainer: {
    alignItems: "center",
    margin: 5,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    width: '45%',
    marginBottom: 10,
  },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 30,
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#DFF7E2",
  },
  roommate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  columnWrapper: {
    justifyContent: "center", // Center the columns horizontally
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  noRoom: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
});