import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Button,
} from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Path, Svg } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import useAxios from "../utils/useAxios";
import NetInfo from "@react-native-community/netinfo";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import { database } from "../components/database/createdb";
import AsyncStorage from "@react-native-async-storage/async-storage";

const screenWidth = Dimensions.get("window").width;

const GroupDetailsScreen = ({ route }) => {
  const { id } = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [groupname, setGroupname] = useState("");
  const [numMembers, setNumMembers] = useState(0);
  const [description, setDescription] = useState("");
  const [theimageurl, settheImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [joinLoading, setjoinLoading] = useState(false);
  const [isUserexists, setisUserexists] = useState(true);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const socket = useSelector((state) => state.socket.instance);
  const [college, setCollege] = useState("");
  const api = useAxios();
  const [networkLoad, setnetworkLoad] = useState(false);
  const [fetchData, setfetchData] = useState(new Map());
  const [loadingImage, setLoadingImage] = useState(new Map());
  const [username, setUsername] = useState("");

  useFocusEffect(
    useCallback(() => {
      setLoadingImage(new Map());
    }, [])
  );

  const getUserName = async () => {
    try {
      let username = await AsyncStorage.getItem("username");
      username = JSON.parse(username);
      setUsername(username);
    } catch (err) {
      setUsername(null);
    }
  };

  useEffect(() => {
    getUserName();
  }, [id]);

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
    if (!networkLoad) {
      setnetworkLoad(true);
      Alert.alert(
        "Something went wrong",
        "Please retry or check your internet connection..."
      );
    }
  };

  const checkUserisInTheGroup = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError("check_user");
        return;
      }
      setLoading(true);
      const response = await api.get(`${baseURL}/api/user/isUserexists/${id}`);
      setisUserexists(response.data.user);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      navigation.navigate("Main", { screen: "chats" });
      if (err.response.status === 503) {
        handleNetworkError("check_user");
      } else {
        handleNetworkError("check_user");
      }
    }
  }, [id]);

  const getGroupDetails = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError("details");
        return;
      }
      setLoading(true);
      const response = await api.get(
        `${baseURL}/api/user/getGroupDetails/${id}`
      );
      setGroupname(response.data.group.name);
      setDescription(response.data.group.description);
      setNumMembers(response.data.members.users.length);
      if (response.data.group.type === "non-course") {
        settheImageUrl(response.data.group.image);
      } else {
        settheImageUrl(response.data.group.theme);
      }
      setCollege(response.data.group.college);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      navigation.navigate("Main", { screen: "chats" });
      if (err.response.status === 503) {
        handleNetworkError("details");
      } else {
        handleNetworkError("details");
      }
    }
  }, [id]);

  useEffect(() => {
    checkUserisInTheGroup();
    getGroupDetails();
  }, [id]);

  const handleJoin = async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "Network Error",
          "There might be an issue with your internet connection try again..."
        );
        return;
      }
      setjoinLoading(true);
      const response = await api.post(`${baseURL}/api/user/joinGroups/${id}/`);
      if (response.data.group.type === "non-course") {
        const { id, admins, users, createdAt, updatedAt, ...rest } = response.data.group;
          await database.write(async () => {
            await database.get("groups").create((group) => {
              Object.assign(group._raw, {
              ...rest,
              group_id: id,
              admins: JSON.stringify(admins),
              createdAt: createdAt,
              updatedAt: updatedAt,
              group_members: JSON.stringify(users),
            });
          });
        });
      }
      else {
        const { id, _count, users, createdAt, updatedAt, admins, ...rest } = response.data.group;
        await database.write(async () => {
          await database.get("groups").create((group) => {
            Object.assign(group._raw, {
              ...rest,
              count: JSON.stringify(_count),
              group_id: id,
              admins: JSON.stringify(admins),
              createdAt: createdAt,
              updatedAt: updatedAt,
              group_members: JSON.stringify(users),
            });
          });
        });
      }
      socket.emit("join-single-room", { group_id: id, username: username });
      if (response.data.group.type === "course") {
        dispatch(handleUseffectActions.setRefreshGroupsScreen({ reload: true }));
      }
      else {
        dispatch(
          handleUseffectActions.setRefreshNonCourseGroups({ reload: true })
        );
      }
      Alert.alert("You have successfully joined the group");
      setjoinLoading(false);
      navigation.navigate("Main", { screen: "chats" });
    } catch (err) {
      console.log(err);
      setjoinLoading(false);
      if (err.response.status === 503) {
        Alert.alert("Network Error", err.response.data.message);
      } else {
        Alert.alert("Something went wrong", err.response.data.message);
      }
    }
  };

  const retryfetch = () => {
    setnetworkLoad(false);
    if (fetchData.get("check_user")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set("check_user", false);
        return newMap;
      });
      checkUserisInTheGroup();
    }

    if (fetchData.get("details")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set("details", false);
        return newMap;
      });
      getGroupDetails();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backIcon}
        onPress={() => navigation.navigate("Groups")}
      >
        <Svg viewBox="0 0 24 24" width={24} height={24}>
          <Path d="M0 0h24v24H0z" fill="none" />
          <Path
            fill="white"
            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
          />
        </Svg>
      </TouchableOpacity>

      {networkLoad ? (
        <View style={{ display: "flex", alignItems: "center", marginTop: 150 }}>
          <Button
            title="Refresh"
            onPress={() => {
              retryfetch();
            }}
          ></Button>
        </View>
      ) : loading ? (
        <View style={{ display: "flex", alignItems: "center", marginTop: 150 }}>
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
          <View
            style={{
              position: "relative",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {loadingImage.get(`groupDetails-${id}`) && (
              <ActivityIndicator style={{ position: "absolute", zIndex: 1 }} />
            )}

            <Image
              source={{ uri: theimageurl }}
              style={styles.groupImage}
              onLoadStart={() => {
                setLoadingImage((prevMap) => {
                  const newMap = new Map(prevMap);
                  newMap.set(`groupDetails-${id}`, true);
                  return newMap;
                });
              }}
              onLoadEnd={() => {
                setTimeout(() => {
                  setLoadingImage((prevMap) => {
                    const newMap = new Map(prevMap);
                    newMap.set(`groupDetails-${id}`, false);
                    return newMap;
                  });
                }, 5);
              }}
            />
          </View>

          <Text style={styles.groupName}>{groupname}</Text>
          <Text style={styles.membersText}>{numMembers} members</Text>
          <Text style={styles.membersText}>University of Houston-Downtown</Text>
          <View style={styles.descriptionBox}>
            <Text
              style={{
                ...styles.membersText,
                color: "white",
                fontWeight: "bold",
                marginBottom: 20,
              }}
            >
              Group Description
            </Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
          {joinLoading ? (
            <ActivityIndicator></ActivityIndicator>
          ) : (
            isUserexists === false && (
              <TouchableOpacity style={styles.JoinButton} onPress={handleJoin}>
                <Text style={styles.buttonText}>Join Group</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "black",
  },
  groupImage: {
    width: screenWidth * 0.4,
    height: screenWidth * 0.4,
    borderRadius: 10,
    marginTop: 100,
    marginBottom: 20,
  },

  groupName: {
    color: "#ffffff",
    fontSize: 30,
    fontFamily: "Poppins",
    fontWeight: "bold",
    marginTop: 15,
  },
  membersText: {
    color: "grey",
    fontSize: 17,
    fontFamily: "Poppins",
    marginTop: 5,
  },
  descriptionBox: {
    backgroundColor: "black",
    width: screenWidth * 0.8,
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    textAlign: "left",
    borderColor: "grey",
    borderWidth: 1,
    marginBottom: 50,
  },
  descriptionText: {
    color: "#e6e6e6",
    fontSize: 12,
    fontFamily: "Poppins",
    fontWeight: "500",
    lineHeight: 13,
  },
  JoinButton: {
    backgroundColor: "black",
    borderColor: "yellow",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 100,
    marginBottom: 12,
    marginTop: 30,
    width: screenWidth * 0.5,
    height: screenWidth * 0.1,
  },
  buttonText: {
    color: "yellow",
    fontSize: 14,
    fontFamily: "Poppins",
    outline: "none",
  },
  backIcon: {
    position: "absolute",
    top: screenWidth * 0.18,
    left: 20,
    width: 25,
    height: 25,
    backgroundColor: "transparent",
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GroupDetailsScreen;
