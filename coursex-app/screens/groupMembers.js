import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
  FlatList,
  ActivityIndicator,
  Button,
  Share
} from "react-native";
import Modal from "react-native-modal";
import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { Path, Svg } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import useAxios from "../utils/useAxios";
import { useSelector } from "react-redux";
import * as Clipboard from "expo-clipboard";
import { useDispatch } from "react-redux";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import NetInfo from "@react-native-community/netinfo";
import { database } from "../components/database/createdb";
import { Q } from "@nozbe/watermelondb";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const GroupMembers = ({ route }) => {
  const { id, username } = route.params;
  const navigation = useNavigation();
  const [groupname, setGroupname] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [leaveChat, setLeaveChat] = useState(false);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const api = useAxios();
  const dispatch = useDispatch();
  const [networkLoad, setnetworkLoad] = useState(false);
  const [loadingImage, setLoadingImage] = useState(new Map());
  const [isModalVisible, setModalVisible] = useState(false);
  const [groupType, setGroupType] = useState("");
  const socket = useSelector((state) => state.socket.instance);
  const refreshGroupMemberScreen = useSelector(
    (state) => state.handleUseffect.refreshGroupMemberScreen
  );
  const [assistant_name, setAssitantName] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [fetchData, setfetchData] = useState(new Map());
  const networkErrorRef = useRef(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const handleNetworkError = (fetchEvent) => {
    setfetchData((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(`${fetchEvent}`, true);
      return newMap;
    });
    if (!networkErrorRef.current) {
      setnetworkLoad(true);
      networkErrorRef.current = true;
      Alert.alert(
        "Something went wrong",
        "Please retry or check your internet connection..."
      );
    }
  };

  const getAssistantName = useCallback(async () => {
    try {
      const response = await api.get(
        `${baseURL}/api/user/getGroupAssistantName/${id}`
      );

      setAssitantName(response.data.message.name);
      setAssistantId(response.data.message.id);
    } catch (err) {
      console.log(err);
    }
  }, [id]);

  const getGroupDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      let usergroup = await database
      .get('groups')
      .query(Q.where('group_id', id))
      .fetch();

      if (usergroup.length > 0) {
        usergroup = usergroup[0]["_raw"];
        const group_members = JSON.parse(usergroup.group_members);
        setGroupname(usergroup.name);
        setGroupType(usergroup.type);
        setGroupMembers(group_members);
      } else {
      //   const state = await NetInfo.fetch();

      //   if (!state.isConnected) {
      //     handleNetworkError("group");
      //     return;
      //   }

      //   const response = await api.get(
      //     `${baseURL}/api/user/getGroupDetails/${id}`
      //   );

      //   setGroupname(response.data.group.name);
      //   setGroupType(response.data.group.type);
      //   setGroupMembers(response.data.members.users);

      //   const { admins, createdAt, updatedAt, ...rest } = response.data.group;
      //   const { users } = response.data.members;

      //   await database.write(async () => {
      //     await database.get("group_details").create((group) => {
      //       Object.assign(group._raw, {
      //         ...rest,
      //         admins : JSON.stringify(admins),
      //         group_id: id,
      //         createdAt : createdAt,
      //         updatedAt : updatedAt,
      //         group_members : JSON.stringify(users)
      //       });
      //     });
      //   });
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("group");
      } else {
        handleNetworkError("group");
      }
    }
  }, [id]);

  useEffect(() => {
    if (refreshGroupMemberScreen || id) {
      if (groupType === "course") {
        getAssistantName();
      }
      getGroupDetails();
      dispatch(
        handleUseffectActions.setRefreshGroupMemberScreen({ reload: false })
      );
    }
  }, [id, groupType, refreshGroupMemberScreen]);

  const getProfile = (id, username, group_id) => {
    navigation.navigate("UserProfile", {
      id: id,
      username: username,
      group_id: group_id,
    });
    toggleModal();
  };

  const handleLinkShare = async () => {
    try {
      const url = `Hi, you are invited to my group "${groupname}" on Coursex: https://coursex.us/app/groups/${id}`;
      const result = await Share.share({
        message: url,
      });
  
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type: ', result.activityType);
        } else {
          console.log('Shared successfully!');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing link: ', error);
      Alert.alert('Error', 'Something went wrong while sharing the link.');
    }
  };

  const handleLeaveChat = async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "Network Error",
          "There might be an issue with your internet connection try again..."
        );
        return;
      }
      setLeaveChat(true);
      const response = await api.post(`${baseURL}/api/user/leaveGroup/${id}/`);
      // let usergroup_details = await database
      // .get('group_details')
      // .query(Q.where('group_id', id))
      // .fetch();
      
      const usergroup = await database
      .get('groups')
      .query(Q.where('group_id', id))
      .fetch();
      // await usergroup_details[0].destroyPermanently();
      if (usergroup.length > 0) {
        // console.log(usergroup);
        await database.write(async () => {
          await usergroup[0].destroyPermanently();
        }); 
      }
      socket.emit("leave-single-room", { group_id: id, username: username });
      dispatch(
        handleUseffectActions.setRefreshNonCourseGroups({ reload: true })
      );
      dispatch(handleUseffectActions.setRefreshGroupsScreen({ reload: true }));
      setLeaveChat(false);
      Alert.alert("You left the group");
      navigation.navigate("Main", { screen: "chats" });
    } catch (err) {
      console.log(err);
      setLeaveChat(false);
      if (err.response.status === 503) {
        Alert.alert("Network Error", err.response.data.message);
      } else {
        Alert.alert("Something went wrong", err.response.data.message);
      }
    }
  };

  const retryfetch = () => {
    setnetworkLoad(false);
    networkErrorRef.current = false;
    if (fetchData.get("assistant")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`assistant`, false);
        return newMap;
      });
      getAssistantName();
    }

    if (fetchData.get("group")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`group`, false);
        return newMap;
      });
      getGroupDetails();
    }
  };

  const renderMemberItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.memberCard}
        onPress={() => getProfile(item.id, username, id)}
        key={item.id}
      >
        <View style={styles.memberInnerLeft}>
          <View
            style={{
              position: "relative",
              width: 100,
              height: 100,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loadingImage.get(`profile-${item.id}`) === true && (
              <ActivityIndicator
                style={{ position: "absolute", zIndex: 1 }}
              ></ActivityIndicator>
            )}

            <Image
              source={{ uri: item.image }}
              style={styles.memberImage}
              onLoadStart={() => {
                setLoadingImage((prevMap) => {
                  const newMap = new Map(prevMap);
                  newMap.set(`profile-${item.id}`, true);
                  return newMap;
                });
              }}
              onLoadEnd={() => {
                setTimeout(() => {
                  setLoadingImage((prevMap) => {
                    const newMap = new Map(prevMap);
                    newMap.set(`profile-${item.id}`, false);
                    return newMap;
                  });
                }, 5);
              }}
            />
          </View>
        </View>

        <View style={styles.memberInnerCenter}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={{ ...styles.usernameText, fontWeight: "350" }}>
            @{item.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {networkLoad ? (
        <View
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 150,
          }}
        >
          <Button title="Refresh" onPress={() => retryfetch()}></Button>
        </View>
      ) : loading ? (
        <View
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 150,
          }}
        >
          <ActivityIndicator></ActivityIndicator>
        </View>
      ) : (
        <View
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={styles.groupName}>More Features</Text>
          <View style={styles.featureContainer}>
            {groupType === "course" && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("GroupChatbotScreen", {
                    id: id,
                    username: username,
                  });
                }}
              >
                <Image
                  source={{
                    uri: "https://assets.api.uizard.io/api/cdn/stream/01112df1-adad-4bda-a8fb-15a8b2729674.png",
                  }}
                  style={styles.groupImage}
                />
              </TouchableOpacity>
            )}

            {groupType === "course" && (
              <TouchableOpacity
                onPress={() => {
                  if (assistantId) {
                    navigation.navigate("UploadDoc", {
                      group_id: id,
                      username: username,
                      assistantId: assistantId,
                      assistantName: assistant_name,
                      redirect: "members",
                    });
                  }
                  else {
                    Alert.alert("Assistant not found", "Please try again later");
                  }
                }}
              >
                <Image
                  source={{
                    uri: "https://assets.api.uizard.io/api/cdn/stream/2c195446-2899-4f5a-90f9-2940b123149d.png",
                  }}
                  style={styles.groupImage}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.featureContainer}>
            {groupType === "course" && (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("FlashCardList", {
                    id: id,
                    username: username,
                    date: new Date().toString(),
                  });
                }}
              >
                <Image
                  source={{
                    uri: "https://assets.api.uizard.io/api/cdn/stream/f08e4f4a-dec1-4b4c-8aa9-115a8f914310.png",
                  }}
                  style={styles.groupImage}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleModal}>
              <Image
                source={{
                  uri: "https://assets.api.uizard.io/api/cdn/stream/166778e3-70b0-4812-ba0d-3ed487f93e04.png",
                }}
                style={styles.groupImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {leaveChat ? (
        <ActivityIndicator></ActivityIndicator>
      ) : (
        <View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleLinkShare}
          >
            <Text style={styles.buttonText}>Share the groupchat link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => {
              handleLeaveChat();
            }}
          >
            <Text style={styles.buttonText}>Leave the chat</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        isVisible={isModalVisible}
        swipeDirection="down"
        onSwipeComplete={toggleModal}
        onBackdropPress={toggleModal}
        style={{ justifyContent: "flex-end", margin: 0 }}
        onRequestClose={toggleModal}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.memberHeaderContainer}>
            <Text style={styles.memberHeaderText}>Group Members</Text>
          </View>
          {loading ? (
            <View style={styles.memberListContainer}>
              <ActivityIndicator />
            </View>
          ) : (
            <View style={styles.memberListContainer}>
              <FlatList
                data={groupMembers}
                renderItem={renderMemberItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.memberList}
              />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  topContainer: {
    position: "absolute",
    top: 10,
    left: screenWidth * 0.05,
    display: "flex",
    flexDirection: "row",
    width: screenWidth * 0.95,
    height: screenWidth * 0.3,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  groupImage: {
    width: screenWidth * 0.4,
    height: screenWidth * 0.4,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#505050",
    marginHorizontal: 5,
  },

  groupName: {
    color: "#ffffff",
    fontSize: 25,
    fontFamily: "Poppins",
    fontWeight: "bold",
    width: screenWidth * 0.7,
    textAlign: "center",
    marginVertical: 30,
  },
  leaveButton: {
    backgroundColor: "#ff3b30",
    borderColor: "#ff3b30",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 10,
    width: screenWidth * 0.8,
    marginTop: 15,
  },
  shareButton: {
    backgroundColor: "#0084ff",
    borderColor: "#0084ff",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 10,
    width: screenWidth * 0.8,
    marginTop: 65,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Red Hat Display",
    outline: "none",
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 50000,
    backgroundColor: "#404040",
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  memberListContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  memberList: {
    width: screenWidth * 0.95,
    alignItems: "center",
    flexDirection: "column",
  },
  memberImage: {
    width: 60,
    height: 60,
    borderRadius: 50000,
  },
  memberName: {
    color: "#ffffff",
    fontSize: 17,
    fontFamily: "Red Hat Display",
    fontWeight: "700",
    marginBottom: 5,
  },
  memberCard: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.2,
    backgroundColor: "transparent",
    borderRadius: 8,
    display: "flex",
    flexDirection: "row",
    marginVertical: 0,
    borderRadius: 15,
  },
  memberInnerLeft: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "25%",
    height: "100%",
  },
  memberInnerCenter: {
    display: "flex",
    alignItems: "left",
    flexDirection: "column",
    justifyContent: "center",
    width: "50%",
    height: "100%",
  },
  memberInnerRight: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "30%",
    height: "100%",
  },
  memberButton: {
    width: "80%",
    height: "33%",
    borderColor: "yellow",
    backgroundColor: "#232222",
    color: "#fef80e",
    fontSize: 12,
    fontFamily: "Poppins",
    fontWeight: "500",
    borderWidth: 1,
    borderRadius: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  membersText: {
    color: "#c2c2c2",
    fontSize: 16,
    fontFamily: "Poppins",
    fontWeight: "500",
    marginTop: 5,
  },
  usernameText: {
    color: "#c2c2c2",
    fontSize: 13,
    fontFamily: "Raleway",
    fontWeight: "700",
    lineHeight: 15,
  },
  shareContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 10,
    height: "12%",
    width: "90%",
  },
  memberHeaderContainer: {
    display: "flex",
    alignItems: "left",
    justifyContent: "center",
    width: "90%",
    height: "10%",
    marginTop: 0,
    marginLeft: 20,
  },
  memberHeaderText: {
    color: "#ffffff",
    fontSize: 25,
    fontFamily: "Red Hat Display",
    fontWeight: "bold",
    lineHeight: 26,
  },
  featureContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    width: screenWidth * 0.85,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  bottomSheet: {
    backgroundColor: "#1f1e1e",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.8,
  },
});

export default GroupMembers;
