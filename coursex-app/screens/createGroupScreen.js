import React, { useState,useEffect } from "react";
import {
  View,
  SafeAreaView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Text,
  TextInput,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
} from "react-native";
import Modal from "react-native-modal";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { Svg, Path } from "react-native-svg";

import { LogBox } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import useAxios from "../utils/useAxios";

import NetInfo from "@react-native-community/netinfo";
import { s3 } from "../utils/aws-sdk-config";
import * as ImageManipulator from "expo-image-manipulator";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import { database } from "../components/database/createdb";
import { useDispatch } from "react-redux";
import { Q } from "@nozbe/watermelondb";
import AsyncStorage from "@react-native-async-storage/async-storage";


LogBox.ignoreAllLogs(true);

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const createGroupScreen = ({ route }) => {
  const { theme } = route.params;
  const [image, setImage] = useState(null);
  const [selectedValue, setSelectedValue] = useState(
    "University of Houston-Downtown"
  );
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [assistantInstructions, setAssistantInstructions] = useState(
    "You are my assistant who will provide answers based on the document data present in the system."
  );
  const [theimageurl, settheImageUrl] = useState(
    "https://assets.api.uizard.io/api/cdn/stream/25c705cc-745b-4a73-a2be-966c759609ba.png"
  );
  const [themeUrl, setThemeUrl] = useState(
    "https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcSgV2TPKV0B901XioWwXT-nJ0EqNldtSxIUr1hqC6MLATt7eeXQEEGeNg2lHDTdXxcr"
  );
  const [loading, setLoading] = useState(false);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const navigation = useNavigation();
  const baseURL = useSelector((state) => state.baseUrl.url);
  const socket = useSelector((state) => state.socket.instance);
  const api = useAxios();
  const [imageUploading, setImageUploading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(1);
  const [username, setUsername] = useState("");
  const dispatch = useDispatch();

  const RadioButton = ({ isSelected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.radioButton}>
      {isSelected ? <View style={styles.radioButtonSelected} /> : null}
    </TouchableOpacity>
  );

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

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
  }, []);

  const theme_colors = [
    {
      id: 3,
      image:
        "https://i.pinimg.com/736x/76/2a/54/762a54f63f37b71707b6ffe62c257ea2.jpg",
    },
    {
      id: 2,
      image:
        "https://m.media-amazon.com/images/I/41gK5nT9L-L._AC_SL1500_.jpg",
    },
    {
      id: 1,
      image:
        "https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcSgV2TPKV0B901XioWwXT-nJ0EqNldtSxIUr1hqC6MLATt7eeXQEEGeNg2lHDTdXxcr",
    },
    {
      id: 8,
      image:
        "https://i.pinimg.com/736x/62/23/28/622328e950856d21eb1856d19f3cee3f.jpg"
    }
  ];

  const theme_colors_2 = [
    {
      id: 4,
      image:
        "https://i.pinimg.com/736x/f1/38/c1/f138c1b6a12b4791995e77613ad1a976.jpg"
    },
    {
      id: 5,
      image:
        "https://i.pinimg.com/736x/9f/5c/b8/9f5cb8a530d5aea1eced66f02eb935cf.jpg"
    },
    {
      id: 6,
      image:
        "https://i.pinimg.com/736x/cb/7c/ff/cb7cffff6bf2c8e3af6bb48d338b30b3.jpg"
    },
    {
      id: 7,
      image:
        "https://i.pinimg.com/736x/75/cd/92/75cd92df029c93efe3ee59ec59dc0a41.jpg"
    }
  ]


  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const uploadPicturestos3 = async (image) => {
    if (!image) {
      return null;
    }
    let imageUrl = "";
    try {
      setImageUploading(true);
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const params = {
        Bucket: "w-groupchat-images-2",
        Key: `groupImages/${Date.now()}_${image.fileName}`,
        Body: blob,
        ContentType: image.type || "image/jpeg",
      };
      const s3Response = await s3.upload(params).promise();
      imageUrl = s3Response.Location;
      setImageUploading(false);
      return imageUrl;
    } catch (err) {
      setImageUploading(false);
      Alert.alert("Failed to upload image, please try again.");
      return null;
    }
  };

  const handleSubmit = async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "There might be an issue with your internet connection try again..."
        );
        return;
      }

      setLoading(true);

      if (
        !groupName.trim() ||
        !groupDescription.trim() ||
        !selectedValue.trim()
      ) {
        Alert.alert("Please provide valid inputs to create a group");
        setLoading(false);
        return;
      }

      const groupImage = await uploadPicturestos3(image);

      const data = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        college: selectedValue.trim(),
        assistantInstruction: assistantInstructions.trim(),
        image: groupImage ? groupImage : theimageurl,
        theme: themeUrl,
        type: theme === 1 ? "course" : "non-course",
      };
      const response = await api.post(`${baseURL}/api/user/createGroup/`, data);
      const { id, _count,users, createdAt, updatedAt, admins, ...rest } = response.data.group;
      console.log("users",users);
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
      socket.emit("join-single-room", {
        group_id: response.data.group.id,
        username: username,
      });
      dispatch(handleUseffectActions.setRefreshGroupsScreen({ reload: true }));
      setLoading(false);
      navigation.navigate("Main", { screen: "chats" });
      Alert.alert("Group created 🔥");
    } catch (err) {
      console.log(err);
      setLoading(false);
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  const handleSubmit2 = async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "There might be an issue with your internet connection try again..."
        );
        return;
      }

      setLoading(true);

      if (
        !groupName.trim() ||
        !groupDescription.trim() ||
        !selectedValue.trim()
      ) {
        Alert.alert("Please provide valid inputs to create a group");
        setLoading(false);
        return;
      }

      const groupImage = await uploadPicturestos3(image);

      const data = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        college: selectedValue.trim(),
        image: groupImage ? groupImage : theimageurl,
        theme: themeUrl,
        type: theme === 1 ? "course" : "non-course",
      };
      const response = await api.post(
        `${baseURL}/api/user/createNonCourseGroup/`,
        data
      );
      const { id, admins, users, createdAt, updatedAt, ...rest } = response.data.group;
      console.log("users",users); 
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
      })});
      
      socket.emit("join-single-room", {
        group_id: response.data.group.id,
        username: username,
      });
      dispatch(
        handleUseffectActions.setRefreshNonCourseGroups({ reload: true })
      );
      setLoading(false);
      navigation.navigate("Main", { screen: "chats" });
      Alert.alert("Group created 🔥");
    } catch (err) {
      console.log(err);
      setLoading(false);
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
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
        mediaTypes: "images",
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
        settheImageUrl(compressedImage.uri);
      }
    } catch (error) {
      Alert.alert("Something went wrong in selecting image. Select again");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 1 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardDismissMode="on-drag"
        >
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => {
              navigation.navigate("ChooseGroupType");
            }}
          >
            <Svg width={15} height={15} viewBox="0 0 448 512">
              <Path
                fill="white"
                d="M447.1 256C447.1 273.7 433.7 288 416 288H109.3l105.4 105.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448s-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L109.3 224H416C433.7 224 447.1 238.3 447.1 256z"
              />
            </Svg>
          </TouchableOpacity>

          <View
            style={styles.scrollView}
            contentContainerStyle={styles.container}
          >
            <TouchableOpacity
              onPress={() => {
                if (theme === 1) {
                  toggleModal();
                } else if (theme === 2) {
                  selectImage();
                }
              }}
            >
              <Image source={{ uri: theimageurl }} style={styles.image} />
            </TouchableOpacity>

            <View style={{ marginBottom: 8, marginTop: 13 }}>
              <Text style={styles.field}>Groupchat name</Text>
              <TextInput
                value={groupName}
                onChangeText={(text) => {
                  if (text.trim().length > 25) {
                    Alert.alert(
                      "Group name should not contain more than 25 characters"
                    );
                  } else {
                    setGroupName(text);
                  }
                }}
                style={styles.input}
              />
            </View>

            <View style={{ marginBottom: 30, marginTop: 13 }}>
              <Text style={styles.field}>Groupchat description</Text>
              <TextInput
                value={groupDescription}
                onChangeText={(text) => {
                  if (text.trim().length > 50) {
                    Alert.alert(
                      "Description should not contain more than 50 characters"
                    );
                  } else {
                    setGroupDescription(text);
                  }
                }}
                style={styles.input}
              />
            </View>

            {loading || imageUploading ? (
              <ActivityIndicator></ActivityIndicator>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={theme === 1 ? handleSubmit : handleSubmit2}
              >
                <Text style={styles.buttonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>

          <Modal
            isVisible={isModalVisible}
            swipeDirection="down"
            onSwipeComplete={toggleModal}
            onBackdropPress={toggleModal}
            style={{ justifyContent: "flex-end", margin: 0 }}
            onRequestClose={toggleModal}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.themeHeadingContainer}>
                <Text style={styles.themeHeading}>Pick a theme...</Text>
              </View>
              <View style={styles.themeOptionRow}>
                {theme_colors.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      settheImageUrl(item.image);
                      setThemeUrl(item.image);
                    }}
                  >
                    <ImageBackground style={styles.themeOption} source={{ uri: item.image }}>
                      <View style={styles.radioButtonContainer}>
                        <RadioButton isSelected={themeUrl === item.image} />
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.themeOptionRow}>
                {theme_colors_2.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      settheImageUrl(item.image);
                      setThemeUrl(item.image);
                    }}
                  >
                    <ImageBackground style={styles.themeOption} source={{ uri: item.image }}>
                      <View style={styles.radioButtonContainer}>
                        <RadioButton isSelected={themeUrl === item.image} />
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    opacity: 0.75,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    marginTop: 40,
    marginBottom: 24,
    width: screenHeight > 800 ? screenWidth * 0.9 : screenWidth * 0.5,
    height: screenHeight > 800 ? screenWidth * 0.9 : screenWidth * 0.5,
    alignSelf: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#505050",
  },
  input: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.1,
    padding: screenWidth * 0.03,
    border: "0",
    boxSizing: "border-box",
    borderRadius: 15,
    backgroundColor: "#1f1e1e",
    color: "white",
    fontSize: 13,
    fontFamily: "Raleway",
    fontWeight: "500",
    lineHeight: 13,
    outline: "none",
  },
  field: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: "400",
    textAlign: "justify",
    marginBottom: 5,
  },
  button: {
    backgroundColor: "white",
    borderColor: "white",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 100,
    marginTop: 10,
    width: screenWidth * 0.5,
    alignSelf: "center",
  },
  buttonText: {
    color: "black",
    fontSize: 15,
    fontFamily: "Poppins",
    fontWeight: "bold",
    outline: "none",
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: "#404040",
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    color: "black",
    width: screenWidth * 0.8,
    height: screenWidth * 0.1,
    padding: screenWidth * 0.03,
    borderRadius: 15,
    backgroundColor: "#1f1e1e",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#1f1e1e",
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 10,
    width: screenWidth * 0.8,
    color: "white",
    backgroundColor: "#1f1e1e",
  },
  radioButtonContainer: {
    position: "absolute",
    top: 5,
    left: 5,
  },
  radioButton: {
    height: 8,
    width: 8,
    borderRadius: 12,
    borderWidth: 0,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "black",
  },
  radioButtonSelected: {
    height: 8,
    width: 8,
    borderRadius: 6,
    backgroundColor: "white",
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
  bottomSheet: {
    backgroundColor: "#1f1e1e",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenWidth, // Adjust height as needed
  },

  flatListContent: {
    alignItems: "center",
    flexDirection: "row",
  },

  flatListContainer: {
    marginTop: 20,
    width: screenWidth * 0.9, // Ensures full width usage
  },

  themeOption: {
    width: screenWidth * 0.2, // Adjust for visible items
    height: screenWidth * 0.2, // Adjust for visible items
    marginHorizontal: 5,
  },
  themeOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
  },
});

export default createGroupScreen;
