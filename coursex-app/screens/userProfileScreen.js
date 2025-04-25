import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  FlatList,
  Button,
  Alert,
  ActivityIndicator,
  Modal
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import useAxios from "../utils/useAxios";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import Svg, { Path } from "react-native-svg";
import { LogBox } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RemoveIcon from "./bottomIcons/removeIcon";
import { Linking } from "react-native";

LogBox.ignoreAllLogs(true);

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const UserProfileScreen = ({ route }) => {
  const { id, username, group_id } = route.params;
  const [user_username, setUsername] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [name, setName] = useState("");
  const [theProfileImage, setProfileImage] = useState(
    "https://assets.api.uizard.io/api/cdn/stream/76560e1c-27c0-49e9-bae9-0c65dfc3e18b.jpeg"
  );
  const [courses, setCourses] = useState("");
  const [user_courses, setUserCourses] = courses.split(",");
  const [loading, setLoading] = useState(false);
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("Sophomore");
  const [major, setMajor] = useState("Computer Science");
  const [loadingImage, setLoadingImage] = useState(new Map());
  const [modalVisible, setModalVisible] = useState(false);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const navigation = useNavigation();
  const api = useAxios();
  const [networkLoad, setnetworkLoad] = useState(false);


  const handleNetworkError = () => {
    if (!networkLoad) {
      setnetworkLoad(true);
      Alert.alert(
        "Something went wrong",
        "Please retry or check your internet connection..."
      );
    }
  };

  const handleBlockUser = () => {
    console.log("Block user functionality");
    
    setModalVisible(false);
  };

  // const handleReportUser = () => {
    
  //   console.log("Report user functionality");
  //   setModalVisible(false);
  // };

  const getUserInfo = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError();
        return;
      }
      setLoading(true);
      const response = await api.get(
        `${baseURL}/api/user/getUerInfoById/${id}`
      );
      setName(response.data.message.name);
      setUsername(response.data.message.username);
      setProfileImage(response.data.message.image);
      setYear(response.data.message.year);
      setMajor(response.data.message.major);
      setCourses(response.data.message.courses);
      setCollege(response.data.message.college);
      setUserCourses(response.data.message.courses.split(","));
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        handleNetworkError();
      } else {
        handleNetworkError();
      }
    }
  }, [id]);

  useEffect(() => {
    getUserInfo();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const retryfetch = () => {
    setnetworkLoad(false);
    getUserInfo();
  };

  const getUserName = async () => {
    try {
      let username = await AsyncStorage.getItem("username");
      username = JSON.parse(username);
      setCurrentUserName(username);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getUserName();
  }, [id]);


  const transformCourses = (courses) => {
    const course_list = courses.split(",");
    const sortedCourses = course_list.sort((a, b) => a.length - b.length);

    const transformedData = [];
    for (let i = 0; i < sortedCourses.length; i++) {
      if (sortedCourses[i].length > 15) {
        transformedData.push({
          id: i.toString(),
          type: "single",
          content: sortedCourses[i],
        });
      } else {
        if (i + 1 < sortedCourses.length && sortedCourses[i + 1].length <= 15) {
          transformedData.push({
            id: i.toString(),
            type: "double",
            content1: sortedCourses[i],
            content2: sortedCourses[i + 1],
          });
          i++;
        } else {
          transformedData.push({
            id: i.toString(),
            type: "single",
            content: sortedCourses[i],
          });
        }
      }
    }
    return transformedData;
  };

  const user_courses_with_id = transformCourses(courses);

  const renderCourse = ({ item }) => {
    if (item.type === "single") {
      return (
        <View style={[styles.courseBox, styles.singleColumnBox]}>
          <Text style={styles.courseText}>{item.content}</Text>
        </View>
      );
    } else if (item.type === "double") {
      return (
        <View style={styles.doubleColumnRow}>
          <View style={[styles.courseBox, styles.shortCourseBox]}>
            <Text style={styles.courseText}>{item.content1}</Text>
          </View>
          <View style={[styles.courseBox, styles.shortCourseBox]}>
            <Text style={styles.courseText}>{item.content2}</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View>
      <ImageBackground
        source={{
          uri: "https://www.colorcombos.com/images/colors/000000.png",
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        
          <View style={styles.backgroundOverlay} />

          {networkLoad ? (
            <View
              style={{
                ...styles.container,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button title="Refresh" onPress={() => retryfetch()}></Button>
            </View>
          ) : loading ? (
            <View
              style={{
                ...styles.container,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator />
            </View>
          ) : (
            <View style={styles.container}>

            { currentUserName !== user_username ? (
            <View style={styles.topContainer}>

            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Svg viewBox="0 0 24 24" width={30} height={30}>
                <Path d="M0 0h24v24H0z" fill="none">
                </Path>
                <Path fill="white" d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z">
                </Path>
              </Svg>
            </TouchableOpacity>

            </View>
            ) : null}
              
              <View
                style={{
                  position: "relative",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 100,
                }}
              >
                {loadingImage.get(`profile-UserProfileImage`) === true && (
                  <ActivityIndicator
                    style={{ position: "absolute", zIndex: 1 }}
                  ></ActivityIndicator>
                )}

                <Image
                  source={{ uri: theProfileImage }}
                  style={styles.Circle}
                  onLoadStart={() => {
                    setLoadingImage((prevMap) => {
                      const newMap = new Map(prevMap);
                      newMap.set(`profile-UserProfileImage`, true);
                      return newMap;
                    });
                  }}
                  onLoadEnd={() => {
                    setTimeout(() => {
                      setLoadingImage((prevMap) => {
                        const newMap = new Map(prevMap);
                        newMap.set(`profile-UserProfileImage`, false);
                        return newMap;
                      });
                    }, 5);
                  }}
                />
              </View>

              <View style={styles.nameBox}>
                <Text style={styles.nameText}>{name}</Text>
                <Text style={styles.usernameText}>@{user_username}</Text>
              </View>

              <View style={styles.Box_1}>
                <View style={styles.inner_box_1}>
                  <Text style={{ fontSize: 40 }}>🎓</Text>
                  <Text style={styles.text_1}>
                    {year}
                    {"\n"}@ UHD
                  </Text>
                </View>
                <View style={styles.inner_box_1}>
                  <Text style={{ fontSize: 40 }}>📚</Text>
                  <Text style={styles.text_1}>{major}</Text>
                </View>
              </View>

              <View style={styles.Box_2}>
                <FlatList
                  data={user_courses_with_id}
                  renderItem={renderCourse}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.courseList}
                />
              </View>
            </View>
          )}
        </KeyboardAvoidingView>

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(false);
            }}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => {
                    setModalVisible(false);
                  }}
                >
                  <RemoveIcon />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{...styles.modalButton}}
                  onPress={() =>
                                    Linking.openURL(
                                      "https://0ezv666sxix.typeform.com/to/A1TUE04W"
                                    )
                                  }
                >
                  <Text style={styles.modalButtonText}>Report User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{...styles.modalButton}}
                  onPress={() => {
                    handleBlockUser();
                  }}
                >
                  <Text style={styles.modalButtonText}>Block User</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    opacity: 1,
  },
  container: {
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-start",
    flexGrow: 1,
  },
  topContainer: {
    marginTop: 5,
    width: screenWidth * 0.9,
    height: screenHeight * 0.1,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  scrollView: {
    // Remove opacity here so it doesn't affect the children
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  Circle: {
    width: screenWidth * 0.45,
    height: screenWidth * 0.45,
    borderRadius: 20,
    marginTop: 0,
  },
  profileImageContainer: {
    marginTop: 50,
    alignSelf: "center",
  },
  profileIamgeSection: {
    flexDirection: "column",
    justifyContent: "flex-start",
    width: screenWidth * 0.45,
    //backgroundColor: "red"
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 6,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  nameText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 30,
    marginTop: 10,
  },
  usernameText: {
    color: "#c2c2c2",
    fontSize: 15,
    fontFamily: "Montserrat",
  },
  universityText: {
    color: "#c2c2c2",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
    marginTop: 10,
  },
  numGroupButton: {
    width: screenWidth * 0.3,
    height: screenWidth * 0.1,
    borderRadius: 25,
    backgroundColor: "#232222",
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  numGroupText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 14,
  },
  editSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: screenWidth * 0.45,
    marginTop: 60,
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 200,
    backgroundColor: "#1e1e1e",
  },
  editButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Montserrat",
  },
  taglineBox: {
    width: screenWidth * 0.85,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "left",
    marginTop: 10,
  },
  tagline: {
    color: "white",
    fontSize: 15,
    fontFamily: "Helvetica",
    marginLeft: 10,
  },
  aboutBox: {
    width: screenWidth * 0.8,
    borderRadius: 10,
    alignItems: "left",
    marginTop: 5,
  },
  aboutText: {
    color: "#bea2d0",
    fontSize: 16,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    textAlign: "left",
  },
  HorizontalDivider: {
    width: screenWidth * 0.8,
    height: 1,
    backgroundColor: "#bea2d0",
    borderRadius: 2,
    marginTop: 5,
  },
  detailBox: {
    width: screenWidth * 0.8,
    borderRadius: 10,
    alignItems: "left",
    marginTop: 10,
    flexDirection: "column",
  },
  details: {
    color: "white",
    fontSize: 14,
    fontFamily: "Montserrat",
  },
  albumHeadingbox: {
    width: screenWidth * 0.8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  nameBox: {
    width: screenWidth,
    height: 50,
    borderRadius: 10,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  albumName: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins",
    fontWeight: "500",
    textAlign: "center",
  },
  imageContainer: {
    width: screenWidth * 0.37,
    height: screenWidth * 0.37,
    borderRadius: 15,
    overflow: "hidden",
    marginHorizontal: 10,
    marginVertical: 10,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  imageStyle: {
    borderRadius: 12,
  },
  nunmPhotoContainer: {
    width: 200,
    height: 20,
    justifyContent: "center",
    alignItems: "green",
  },
  albumPhotosNum: {
    width: 30,
    height: 30,
    borderRadius: 1000,
    backgroundColor: "#232222",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    marginBottom: 12,
    opacity: 0.95,
    marginRight: 7,
    marginTop: 7,
  },
  albumsListContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: screenWidth * 1.05,
  },
  albumsList: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  numPhotosText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end", // This ensures the bottom sheet stays at the bottom
    backgroundColor: "transparent", // Semi-transparent background
  },
  bottomSheet: {
    backgroundColor: "#151515",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.8, // Set a fixed height for the bottom sheet (adjust as needed)
    // You can set minHeight here if needed:
    // minHeight: 150,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "flex-end", // Spaces buttons evenly
    alignItems: "center",
    paddingVertical: 10,
  },
  navButton: {
    fontSize: 16,
    color: "#C0C0C0", // Light gray for unselected buttons
    fontWeight: "500",
    paddingHorizontal: 10,
  },
  saveButton: {
    fontSize: 16,
    color: "#FFD700", // Bright yellow color for the Save button
    fontWeight: "bold",
    paddingHorizontal: 10,
  },
  activeButton: {
    color: "white", // Highlight color for the selected button
    fontWeight: "bold",
  },
  profileContainer: {
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  coverImage: {
    width: screenWidth * 0.9,
    height: 150,
    borderRadius: 5,
    marginBottom: 20,
    marginTop: 20,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  input: {
    backgroundColor: "#1f1f1f",
    color: "white",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    width: screenWidth * 0.8,
    borderColor: "#505050",
    borderWidth: 1,
  },
  inputMulti: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    width: "100%",
    height: 100,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 10,
    borderColor: "#505050",
    paddingHorizontal: 10,
    width: screenWidth * 0.8,
    height: 40,
    color: "white",
    backgroundColor: "#1f1e1e",
    flexDirection: "row",
    justifyContent: "space-between", // Aligns items to the start (left)
    alignItems: "center", // Keeps items vertically centered
    marginBottom: 20,
  },
  input_2: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.1,
    padding: screenWidth * 0.03,
    border: "0",
    boxSizing: "border-box",
    borderRadius: 10,
    backgroundColor: "#1f1e1e",
    borderWidth: 1,
    borderColor: "#505050",
    color: "white",
    fontSize: 13,
    fontFamily: "Raleway",
    fontWeight: "500",
    outline: "none",
    marginBottom: 20,
  },
  selectionField: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  themeContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  themeHeadingContainer: {
    width: screenWidth * 0.8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  themeHeading: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Raleway",
    fontWeight: 700,
    lineHeight: 22,
  },
  themeOption: {
    width: screenWidth * 0.9,
    height: 400,
    marginTop: 20,
    marginHorizontal: 10,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  radioButtonContainer: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  radioButton: {
    height: 15,
    width: 15,
    borderRadius: 12,
    borderWidth: 0,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  radioButtonSelected: {
    height: 15,
    width: 15,
    borderRadius: 6,
    backgroundColor: "white",
  },
  Box_1: {
    marginTop: 20,
    width: screenWidth * 0.9,
    height: 100,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  inner_box_1: {
    width: screenWidth * 0.42,
    height: 55,
    backgroundColor: "#151515",
    justifyContent: "space-around",
    flexDirection: "row",
    borderColor: "#505050",
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
  },
  text_1: {
    color: "#c2c2c2",
    fontSize: 15,
    fontFamily: "Montserrat",
    fontWeight: "350",
    width: "50%",
  },
  Box_2: {
    marginTop: -25,
    width: screenWidth * 0.9,
    maxHeight: 110,
    backgroundColor: "#151515",
    borderColor: "#505050",
    borderWidth: 1,
    justifyContent: "flex-start",
    flexDirection: "column",
    alignItems: "center",
    borderRadius: 20,
    padding: 10,
  },
  courseText: {
    color: "#c2c2c2",
    fontSize: 15,
    fontWeight: "350",
    lineHeight: 20,
    textAlign: "center",

    width: "80%",
    textAlign: "center",
  },
  courseBox: {
    borderRadius: 100,
    backgroundColor: "#2b2b2b",
    justifyContent: "center",
    marginVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  shortCourseBox: {
    width: screenWidth * 0.35,
    height: 30,
    marginHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  longCourseBox: {
    width: screenWidth * 0.6, // Centered and wider for long course names
    height: 30,
    alignSelf: "center",
  },
  courseList: {
    width: screenWidth * 0.8,
    justifyContent: "center",
    alignItems: "center",
    //marginTop: 20
  },
  singleColumnBox: {
    width: "100%",
    height: 40,
    padding: 10,
    paddingHorizontal: 20,
  },
  doubleColumnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: screenWidth * 0.7,
    backgroundColor: "#1f1f1f",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  removeIcon: {
    position: "absolute",
    top: -5, // Moves the icon up so that half is outside
    right: -5, // Moves the icon to the right, so it's half outside the corner
    backgroundColor: "#d70900",
    zIndex: 1,
    width: 20, // Size of the icon
    height: 20, // Size of the icon
    borderRadius: 15, // Ensures the icon is circular
    justifyContent: "center",
    alignItems: "center",
  },
  modalButton: {
    width: "70%",
    padding: 7,
    backgroundColor: "white",
    borderRadius: 100,
    marginTop: 10,
  },
  modalButtonText: {
    color: "black",
    fontSize: 16,
    textAlign: "center",
  },
});

export default UserProfileScreen;
