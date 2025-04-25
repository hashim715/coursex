import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import useAxios from "../utils/useAxios";
import { useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const GroupsScreen = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const api = useAxios();
  const [networkLoad, setnetworkLoad] = useState(false);
  const [loadingImage, setLoadingImage] = useState(new Map());

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const handleNetworkError = () => {
    if (!networkLoad) {
      setnetworkLoad(true);
      Alert.alert(
        "Something went wrong",
        "Please retry or check your internet connection..."
      );
    }
  };

  const getGroups = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError();
        return;
      }
      setLoading(true);
      const response = await api.get(`${baseURL}/api/user/getGroups`);
      setGroups(response.data.message);
      setFilteredGroups(response.data.message);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      handleNetworkError();
    }
  }, []);

  useEffect(() => {
    getGroups();
  }, []);

  const handlePress = () => {
    navigation.navigate("Main", { screen: "chats" });
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filteredData = groups.filter((group) =>
      group.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredGroups(filteredData);
  };

  const renderGroupItem = ({ item }) => (
    <View style={styles.groupItem} key={`group-${item.id}`}>
      <TouchableOpacity
        style={styles.groupimageContainer}
        onPress={() => {
          navigation.navigate("GroupDetails", { id: item.id });
        }}
      >
        <View
          style={{
            position: "relative",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {loadingImage.get(`group-${item.id}`) && (
            <ActivityIndicator style={{ position: "absolute", zIndex: 1 }} />
          )}
          <Image
            source={{ uri: item.image }}
            style={styles.groupimageContainer}
            onLoadStart={() => {
              setLoadingImage((prevMap) => {
                const newMap = new Map(prevMap);
                newMap.set(`group-${item.id}`, true);
                return newMap;
              });
            }}
            onLoadEnd={() => {
              setTimeout(() => {
                setLoadingImage((prevMap) => {
                  const newMap = new Map(prevMap);
                  newMap.set(`group-${item.id}`, false);
                  return newMap;
                });
              }, 5);
            }}
          />
        </View>
      </TouchableOpacity>
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.GroupMembers}>{item._count.users} members</Text>
    </View>
  );

  const retryfetch = () => {
    setnetworkLoad(false);
    getGroups();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={{ ...styles.backIcon }} onPress={handlePress}>
        <Svg width={30} height={30} viewBox="0 0 320 512">
          <Path
            fill="white"
            d="M224 480c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l169.4 169.4c12.5 12.5 12.5 32.75 0 45.25C240.4 476.9 232.2 480 224 480z"
          />
        </Svg>
      </TouchableOpacity>

      <View style={styles.topContainer}></View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.inputbox}
            placeholder="Search groups inside your college"
            placeholderTextColor="gray"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <Svg
            viewBox="0 0 24 24"
            height={24}
            width={24}
            style={{ marginLeft: screenWidth * 0.0125 }}
          >
            <Path d="M0 0h24v24H0z" fill="none" />
            <Path
              fill="white"
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </Svg>
        </View>
      </View>

      <View style={styles.groupsListContainer}>
        {networkLoad ? (
          <TouchableOpacity onPress={retryfetch}>
            <Text style={{ color: "#00aeff", fontSize: 16 }}>Retry</Text>
          </TouchableOpacity>
        ) : loading ? (
          <ActivityIndicator style={{ marginTop: 50 }} />
        ) : filteredGroups.length > 0 ? (
          <FlatList
            data={filteredGroups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
          />
        ) : (
          <View
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white" }}>Add Groups</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    justifyContent: "flex-start",
    alignItems: "center",
    flexGrow: 1,
  },
  topContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: screenWidth * 0.8,
    marginTop: screenHeight > 800 ? 50 : 30,

  },
  backIcon: {
    position: "absolute",
    top: screenHeight > 800 ? 70 : 20,
    left: 20,
    width: 25,
    height: 25,
  },
  heading: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "bold",
  },
  createButton: {
    width: 100,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00aeff",
    borderRadius: 25,
    backgroundColor: "#000000",
  },
  createButtonText: {
    color: "#00aeff",
    fontSize: 10,
    fontWeight: "500",
  },
  searchContainer: {
    width: "90%",
    marginTop: 20,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 10,
    color: "#ffffff",
    
  },
  groupsListContainer: {
    flex: 1,
    alignItems: "center",
  },
  groupItem: {
    width: screenWidth * 0.4,
    // height: screenWidth * 0.55,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
    marginVertical: 5,
  },
  groupimageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    justifyContent: "center",
    marginVertical: 10,
  },
  groupName: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
  },
  GroupMembers: {
    color: "#c2c2c2",
    fontSize: 10,
    textAlign: "center",
  },
  inputContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: screenWidth * 0.9,
    height: screenWidth * 0.1,
    alignSelf: "center",
    marginTop: 10,
  },
  inputWrapper: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 15,
   
    backgroundColor: "black",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 1000,
  },
  inputbox: {
    backgroundColor: "black",
    borderWidth: 0,
    height: "100%",
    fontSize: 12,
    flex: 1,
    marginLeft: 5,
    color: "white",
    fontFamily: "Raleway",
  },
});

export default GroupsScreen;
