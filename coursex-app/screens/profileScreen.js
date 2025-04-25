import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  FlatList,
  TextInput,
  Alert,
  Button,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import useAxios from "../utils/useAxios";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import Svg, { Path } from "react-native-svg";
import { useDispatch } from "react-redux";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import RNPickerSelect from "react-native-picker-select";
import * as ImagePicker from "expo-image-picker";

import { LogBox } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { s3 } from "../utils/aws-sdk-config";
import * as ImageManipulator from "expo-image-manipulator";

LogBox.ignoreAllLogs(true);

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const ProfileScreen = ({ route }) => {
  const [user_username, setUsername] = useState("");
  const [name, setName] = useState("");

  const [theProfileImage, setProfileImage] = useState("");
  const [image, setImage] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [courses, setCourses] = useState("");
  const user_courses = courses.split(",");
  const [loading, setLoading] = useState(false);
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [major, setMajor] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const [submitLoading, setsubmitLoading] = useState(false);
  const navigation = useNavigation();
  const api = useAxios();
  const [networkLoad, setnetworkLoad] = useState(false);
  const [isImageUploaded, setisImageUploaded] = useState(false);

  const refreshProfileScreen = useSelector(
    (state) => state.handleUseffect.refreshProfileScreen
  );
  const [loadingImage, setLoadingImage] = useState(new Map());
  const dispatch = useDispatch();
  const [reloadKey, setReloadKey] = useState(Date.now());

  const reloadImage = () => {
    setReloadKey(Date.now());
  };

  useFocusEffect(
    useCallback(() => {
      reloadImage();
    }, [])
  );

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const selectImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        allowsEditing: true,
        quality: 1,
      });

      const compressedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      if (!result.canceled) {
        setImage({ ...result.assets[0], uri: compressedImage.uri });
        setisImageUploaded(false);
      }
    } catch (error) {
      Alert.alert("Something went wrong in selecting image. Select again");
    }
  };

  const handleNetworkError = () => {
    if (!networkLoad) {
      setnetworkLoad(true);
      Alert.alert(
        "Something went wrong",
        "Please retry or check your internet connection..."
      );
    }
  };

  const getUserInfo = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError();
        return;
      }

      setLoading(true);
      const response = await api.get(`${baseURL}/api/user/getuserinfo`);
      const profile_data = response.data;

      setName(profile_data.message.name);
      setUsername(profile_data.message.username);
      setProfileImage(profile_data.message.image);
      setCollege(profile_data.message.college);
      setYear(profile_data.message.year);
      setMajor(profile_data.message.major);
      setCourses(profile_data.message.courses);
      setLoading(false);
      setRefresh(false);
    } catch (err) {
      setLoading(false);
      setRefresh(false);
      if (err.response.status === 503) {
        handleNetworkError();
      } else {
        handleNetworkError();
      }
    }
  }, [refreshProfileScreen, refresh]);

  useEffect(() => {
    if (refreshProfileScreen || refresh) {
      getUserInfo();
      dispatch(
        handleUseffectActions.setRefreshProfileScreen({ reload: false })
      );
    }
  }, [refreshProfileScreen, refresh]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const getS3KeyFromURL = (url) => {
    try {
      const key = new URL(url).pathname.slice(1);
      return key;
    } catch (error) {
      return null;
    }
  };

  const deleteFromS3 = async (bucketName, key) => {
    const params = {
      Bucket: bucketName,
      Key: key,
    };

    try {
      await s3.deleteObject(params).promise();
      return true;
    } catch (err) {
      return null;
    }
  };

  const uploadPicturestos3 = async (image) => {
    let imageUrl = "";
    if (!image) {
      return null;
    }
    try {
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const params = {
        Bucket: "w-groupchat-images-2",
        Key: `profileImages/${Date.now()}_${image.fileName}`,
        Body: blob,
        ContentType: image.type || "image/jpeg",
      };
      const s3Response = await s3.upload(params).promise();
      imageUrl = s3Response.Location;
      setisImageUploaded(true);
      return imageUrl;
    } catch (err) {
      Alert.alert("Failed to upload image, please try again.");
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "There might be an issue with your internet connection. Please try again..."
        );
        return;
      }
      setsubmitLoading(true);
      if (
        !name.trim() ||
        !college.trim() ||
        !year.trim() ||
        !major.trim() ||
        !courses.trim() ||
        !theProfileImage.trim()
      ) {
        Alert.alert("Please provide valid inputs");
        setsubmitLoading(false);
        return;
      }

      let profile_imageUri = null;
      if (!isImageUploaded) {
        profile_imageUri = await uploadPicturestos3(image);
        if (image) {
          if (!profile_imageUri) {
            setsubmitLoading(false);
            return;
          }
        }
      }

      if (profile_imageUri) {
        const key = getS3KeyFromURL(theProfileImage);
        if (key) {
          const checkdelete = await deleteFromS3("w-groupchat-images-2", key);
          if (!checkdelete) {
            Alert.alert("Something went wrong try again...");
            setsubmitLoading(false);
            return;
          }
        }
      }

      if (profile_imageUri) {
        setProfileImage(profile_imageUri);
      }

      const data = {
        name: name.trim(),
        college: college.trim(),
        year: year.trim(),
        courses: courses.trim(),
        major: major.trim(),
        profile_image: profile_imageUri ? profile_imageUri : theProfileImage,
      };
      const response = await api.post(
        `${baseURL}/api/user/updateUserInfo/`,
        data
      );
      setImage(null);
      setRefresh(true);
      setsubmitLoading(false);
      setisImageUploaded(false);
      toggleModal();
      Alert.alert("Your profile info updated successfully");
    } catch (err) {
      setsubmitLoading(false);
      setRefresh(false);
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  const majorOptions = [
    { label: "Computer Science", value: "Computer Science" },
    { label: "Data Science", value: "Data Science" },
    { label: "Engineering", value: "Engineering" },
    { label: "Business", value: "Business" },
    { label: "Biology", value: "Biology" },
    { label: "Chemistry", value: "Chemistry" },
    { label: "Physics", value: "Physics" },
    { label: "Mathematics", value: "Mathematics" },
    { label: "Psychology", value: "Psychology" },
    { label: "Economics", value: "Economics" },
    { label: "Marketing", value: "Marketing" },
    { label: "Finance", value: "Finance" },
    { label: "Nursing", value: "Nursing" },
    { label: "Education", value: "Education" },
    { label: "Political Science", value: "Political Science" },
    { label: "English", value: "English" },
    { label: "History", value: "History" },
    { label: "Sociology", value: "Sociology" },
    { label: "Art", value: "Art" },
  ];

  const retryfetch = () => {
    setnetworkLoad(false);
    getUserInfo();
  };

  const transformCourses = (courses) => {
    const sortedCourses = courses.sort((a, b) => a.length - b.length);

    const transformedData = [];
    for (let i = 0; i < sortedCourses.length; i++) {
      if (sortedCourses[i].length >= 20) {
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

  const user_courses_with_id = transformCourses(user_courses);

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

  const handleLoadStart = (type, name, value) => {
    setLoadingImage((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(`${type}-${name}`, value);
      return newMap;
    });
  };

  const handleLoadEnd = (type, name, value) => {
    setTimeout(() => {
      setLoadingImage((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`${type}-${name}`, value);
        return newMap;
      });
    }, 5);
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
          ) : loading || submitLoading ? (
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
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: screenHeight * 0.07,
                  left: screenWidth * 0.85,
                  width: 40,
                  height: 40,
                  borderRadius: 100,
                  backgroundColor: "#1e1e1e",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => {
                  navigation.navigate("Setting");
                }}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Path d="M0 0h24v24H0V0z" fill="none"></Path>
                  <Path
                    fill="gray"
                    d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                  ></Path>
                </Svg>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  ...styles.editButton,
                  position: "absolute",
                  top: screenHeight * 0.07,
                  left: screenWidth * 0.72,
                }}
                onPress={() => {
                  toggleModal();
                }}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Path d="M0 0h24v24H0z" fill="none" />
                  <Path
                    fill="gray"
                    d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                  />
                </Svg>
              </TouchableOpacity>

              <View
                style={{
                  position: "relative",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 100,
                }}
              >
                {loadingImage.get("profile-profileImage") && (
                  <ActivityIndicator
                    style={{ position: "absolute", zIndex: 1 }}
                  ></ActivityIndicator>
                )}

                <Image
                  source={{
                    uri: theProfileImage,
                  }}
                  key={reloadKey}
                  style={styles.Circle}
                  onLoadStart={() => {
                    handleLoadStart("profile", "profileImage", true);
                  }}
                  onLoadEnd={() => {
                    handleLoadEnd("profile", "profileImage", false);
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

          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={toggleModal}
            swipeDirection="down"
            onSwipeComplete={toggleModal}
            onBackdropPress={toggleModal}
          >
            <KeyboardAvoidingView
              style={styles.modalContainer}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}
            >
              <View
                style={styles.modalContainer}
                // onStartShouldSetResponder={() => true}
                // onResponderRelease={() => toggleModal()}
              >
                <View style={styles.bottomSheet}>
                  <View style={styles.navBar}>
                    <TouchableOpacity
                      onPress={() => {
                        handleSubmit();
                      }}
                    >
                      {loading || submitLoading ? (
                        <ActivityIndicator></ActivityIndicator>
                      ) : (
                        <Text style={styles.saveButton}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.profileContainer}>
                    <View style={styles.profileImageContainer}>
                      <TouchableOpacity
                        onPress={() => selectImage()}
                        style={{
                          borderRadius: 5,
                          overflow: "hidden",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <ImageBackground
                          source={{
                            uri: image ? image.uri : theProfileImage,
                          }}
                          style={{
                            ...styles.profileImage,
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "flex-end",
                          }}
                          onLoadStart={() => {
                            handleLoadStart(
                              "profile",
                              "editprofileImage",
                              true
                            );
                          }}
                          onLoadEnd={() => {
                            handleLoadEnd("profile", "editprofileImage", false);
                          }}
                        >
                          {loadingImage.get("profile-editprofileImage") && (
                            <ActivityIndicator
                              style={{ alignSelf: "center" }}
                            ></ActivityIndicator>
                          )}
                          <TouchableOpacity
                            style={{ margin: "2%" }}
                            onPress={() => {
                              selectImage();
                            }}
                          >
                            <Svg width={20} height={20} viewBox="0 0 24 24">
                              <Path d="M0 0h24v24H0z" fill="none" />
                              <Path
                                fill="white"
                                d="M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 1 0 0-6.4z"
                              />
                              <Path
                                fill="white"
                                d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
                              />
                            </Svg>
                          </TouchableOpacity>
                        </ImageBackground>
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={{ ...styles.input, marginTop: 40 }}
                      placeholder={"Your name"}
                      defaultValue={name}
                      value={name}
                      onChangeText={(text) => {
                        if (text.trim().length > 25) {
                          Alert.alert(
                            "Name shoud contain more than 20 characters"
                          );
                        } else {
                          setName(text);
                        }
                      }}
                    />

                    <View style={styles.dropdown}>
                      <View style={styles.selectionField}>
                        <RNPickerSelect
                          activeItemStyle={{ color: "black" }}
                          onValueChange={(value) => setYear(value)}
                          items={[
                            {
                              label: "Freshmen",
                              value: "Freshmen",
                            },
                            {
                              label: "Sophomore",
                              value: "Sophomore",
                            },
                            {
                              label: "Junior",
                              value: "Junior",
                            },
                            {
                              label: "Senior",
                              value: "Senior",
                            },
                          ]}
                          placeholder={{
                            label: year ? year : "Select year",
                            value: year,
                            color: "white",
                          }}
                          value={year}
                          style={pickerSelectStyles}
                          Icon={() => {
                            return (
                              <View
                                style={{
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  marginTop: 7.5,
                                }}
                              >
                                <Svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <Path
                                    d="M7 10l5 5 5-5"
                                    stroke="gray"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </Svg>
                              </View>
                            );
                          }}
                        />
                      </View>
                    </View>

                    <View style={styles.dropdown}>
                      <View style={styles.selectionField}>
                        <RNPickerSelect
                          onValueChange={(value) => setMajor(value)}
                          items={majorOptions}
                          placeholder={{
                            label: major ? major : "Select major",
                            value: major,
                            color: "gray",
                          }}
                          value={major}
                          style={pickerSelectStyles}
                          useNativeAndroidPickerStyle={false}
                          Icon={() => {
                            return (
                              <View
                                style={{
                                  width: 20,
                                  height: 20,
                                  display: "flex",
                                  marginTop: 7.5,
                                }}
                              >
                                <Svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <Path
                                    d="M7 10l5 5 5-5"
                                    stroke="gray"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </Svg>
                              </View>
                            );
                          }}
                        />
                      </View>
                    </View>

                    <TextInput
                      value={courses}
                      onChangeText={(text) => {
                        const courseList = text
                          .split(",")
                          .map((course) => course.trim());
                        const longCourse = courseList.find(
                          (course) => course.length > 25
                        );

                        if (longCourse) {
                          Alert.alert(
                            `The course "${longCourse}" exceeds 20 characters. Please shorten it and try again.`
                          );
                          return;
                        }
                        setCourses(text);
                      }}
                      style={styles.input_2}
                      placeholder="Your Courses"
                      placeholderTextColor={"gray"}
                    />
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </KeyboardAvoidingView>
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
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  Circle: {
    width: screenWidth * 0.45,
    height: screenWidth * 0.45,
    borderRadius: 20,
    marginTop: screenHeight > 800 ? 50 : 0,
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
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: 200,
    backgroundColor: "yellow",
    justifyContent: "flex-end",
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
    maxHeight: screenHeight > 800 ? 140 : 100,
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
    width: "95%",
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
    height: 30,
    paddingHorizontal: 20,
  },
  doubleColumnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const pickerSelectStyles = {
  inputIOS: {
    color: "white",
    paddingVertical: 12,
  },
  inputAndroid: {
    color: "white",
    paddingVertical: 12,
  },
  placeholder: {
    color: "gray",
  },
};

export default ProfileScreen;
