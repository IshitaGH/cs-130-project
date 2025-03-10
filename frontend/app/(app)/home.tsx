import React, { useEffect, useState, useCallback } from "react";
import { RefreshControl, View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Pressable, Animated, ActivityIndicator } from "react-native";
import { useAuthContext } from "@/contexts/AuthContext";
import { apiGetRoom, apiGetRoommates, apiGetProfilePicture, apiGetRoommatesWithProfiles } from "@/utils/api/apiClient";
import { formatBase64Image } from "@/utils/imageCache";
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
  avatar: string | null;
  isCurrentUser?: boolean;
}

export default function HomeScreen() {
  const { session, sessionLoading, userId } = useAuthContext();
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState<Roommate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [loadingRoommates, setLoadingRoommates] = useState(true);
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  useEffect(() => {
    if (modalVisible) {
      // Run animations when modal opens
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [modalVisible]);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    if (!session) return;

    try {
      const room = await apiGetRoom(session);
      setRoomData(room);
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

  const fetchRoommates = useCallback(async () => {
    if (!session) return;
    
    setLoadingRoommates(true);
    
    try {
      const roommatesWithProfiles = await apiGetRoommatesWithProfiles(session);
      
      const currentUser = roommatesWithProfiles.find(roommate => roommate.id === userId);
      
      const otherRoommates = roommatesWithProfiles
        .filter(roommate => roommate.id !== userId)
        .map(roommate => ({
          id: roommate.id,
          first_name: roommate.first_name,
          last_name: roommate.last_name,
          avatar: roommate.profilePicture,
        }));
      
      const formattedRoommates = [];
      
      if (currentUser) {
        formattedRoommates.push({
          id: currentUser.id,
          first_name: "You",
          last_name: "",
          avatar: currentUser.profilePicture,
          isCurrentUser: true
        });
      }
      
      formattedRoommates.push(...otherRoommates);
      
      setRoommates(formattedRoommates);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error Fetching Roommates",
        text2: error.message || "Failed to fetch roommates",
      });
    } finally {
      setLoadingRoommates(false);
    }
  }, [session, userId]);

  const handleRoommatePress = (roommate: Roommate) => {
    setSelectedRoommate(roommate);
    setModalVisible(true);
  };

  if (sessionLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Welcome to Roomies!</Text>
          <Text style={styles.welcomeSubtitle}>
            {roomData?.room_id 
              ? "Your shared living space" 
              : "You are not in a room yet"}
          </Text>
        </View>

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

        <View style={[styles.card, styles.roommatesCard]}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={22} color="#007F5F" />
            <Text style={styles.cardTitle}>Your Roommates</Text>
          </View>
          
          {loadingRoommates ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007F5F" />
              <Text style={styles.loadingText}>Loading roommates...</Text>
            </View>
          ) : roommates.length > 0 ? (
            <View style={styles.roommatesContainer}>
              <ScrollView 
                style={styles.roommatesScrollView}
                contentContainerStyle={[
                  styles.roommatesScrollContent,
                  { paddingTop: 10 }
                ]}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#00D09E"
                    colors={["#00D09E"]}
                    progressViewOffset={10}
                  />
                }
              >
                <View style={styles.roommatesGrid}>
                  {roommates.map(item => (
                    <TouchableOpacity 
                      key={item.id.toString()} 
                      style={styles.roommateContainer}
                      onPress={() => handleRoommatePress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.avatarContainer}>
                        <Image
                          source={{ uri: item.avatar || defaultAvatar }}
                          style={styles.avatar}
                          fadeDuration={100}
                          onError={(e) => {
                            console.log("Image loading error:", e.nativeEvent.error);
                          }}
                        />
                      </View>
                      <Text 
                        style={styles.roommate}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.first_name} {item.last_name}
                      </Text>
                    </TouchableOpacity>
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

      {/* Roommate Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <Animated.View 
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              }
            ]} 
          >
            <Pressable onPress={e => e.stopPropagation()}>
              {selectedRoommate && (
                <View style={styles.roommateDetailContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {selectedRoommate.isCurrentUser ? "Your Profile" : "Roommate Profile"}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.profileImageContainer}>
                    <Image
                      source={{ uri: selectedRoommate.avatar || defaultAvatar }}
                      style={styles.profileImage}
                      fadeDuration={100}
                      onError={(e) => {
                        console.log("Image loading error:", e.nativeEvent.error);
                      }}
                    />
                  </View>
                  
                  <Text style={styles.profileName}>
                    {selectedRoommate.isCurrentUser ? 
                      "You" : 
                      `${selectedRoommate.first_name} ${selectedRoommate.last_name}`
                    }
                  </Text>
                  
                  <View style={styles.profileInfoContainer}>
                    <View style={styles.profileInfoItem}>
                      <Ionicons 
                        name={selectedRoommate.isCurrentUser ? "person-circle" : "person"} 
                        size={20} 
                        color="#007F5F" 
                      />
                      <Text style={styles.profileInfoText}>
                        {selectedRoommate.isCurrentUser ? "You (Current User)" : "Roommate"}
                      </Text>
                    </View>
                    
                    <View style={styles.profileInfoItem}>
                      <Ionicons name="home" size={20} color="#007F5F" />
                      <Text style={styles.profileInfoText}>
                        {roomData?.name || "Shared Room"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    color: "#007F5F",
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
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007F5F',
  },
  closeButton: {
    padding: 5,
  },
  roommateDetailContent: {
    alignItems: 'center',
    width: '100%',
  },
  profileImageContainer: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 75,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#DFF7E2",
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  profileInfoContainer: {
    width: '100%',
    marginTop: 10,
  },
  profileInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
    padding: 10,
    borderRadius: 10,
  },
  profileInfoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});