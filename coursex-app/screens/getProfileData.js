import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  SafeAreaView,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";
import RNPickerSelect from "react-native-picker-select";
import { useSelector, useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authActions } from "../store/reducers/auth-slice";
import axios from "axios";
import * as jwtDecodeModule from "jwt-decode";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import { s3 } from "../utils/aws-sdk-config";

const screenWidth = Dimensions.get("window").width;

const GetProfileData = ({ route }) => {
  const { token } = route.params;
  const navigation = useNavigation();

  const [college, setCollege] = useState("");
  const [year, setYear] = useState("Student");
  const [major, setMajor] = useState("Not Selected");
  const [courses, setCourses] = useState("None Selected");
  const [chatbotName, setchatbotName] = useState("Sia");
  const [assistantInstruction, setAssistantInstruction] = useState(
    "You are my assistant who will provide answers based on the document data present in the system."
  );
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const [profile_image, setProfileImage] = useState(
    "https://assets.api.uizard.io/api/cdn/stream/72aa7c72-8bd6-4874-b4ad-36a00b6d5bf2.png"
  );
  const baseURL = useSelector((state) => state.baseUrl.url);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        navigation.navigate("Main", { screen: "chats" });
      }
    }, [isLoggedIn])
  );

  const saveTokenLocally = async (token) => {
    const user = jwtDecodeModule.jwtDecode(token);
    try {
      await AsyncStorage.setItem("token", JSON.stringify(token));
      await AsyncStorage.setItem("username", JSON.stringify(user.username));
    } catch (storageError) {
      Alert.alert("Failed to save token");
      return;
    }
    dispatch(authActions.login({ token: token }));
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

      if (
        !college.trim() ||
        !year.trim() ||
        !major.trim() ||
        !courses.trim() ||
        !chatbotName.trim()
      ) {
        Alert.alert("Please provide valid inputs");
        return;
      }

      setLoading(true);

      const data = {
        college: college.trim(),
        year: year.trim(),
        major: major.trim(),
        courses: courses.trim(),
        profile_image: profile_image,
        assistantName: chatbotName.trim(),
        assistantInstruction: assistantInstruction.trim(),
        token: token,
      };

      const response = await axios.post(
        `${baseURL}/api/user/updateUserProfileOnSignUp/`,
        data
      );

      await saveTokenLocally(token);
      setCollege("");
      setYear("");
      setMajor("");
      setCourses("");
      setchatbotName("");
      setLoading(false);
      dispatch(handleUseffectActions.setRefreshProfileScreen({ reload: true }));
      Alert.alert("Your profile info saved successfully");
      navigation.navigate("Main", { screen: "chats" });
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  const collegeOptions = [
    {
      label: "University of Houston-Downtown",
      value: "University of Houston-Downtown",
    },
    { label: "University of Houston", value: "University of Houston" },
    { label: "Houston Community College", value: "Houston Community College" },
    {label: "Other", value: "Other College"},
  ];

  return (
    <SafeAreaView style={styles.profileContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView>


          <View style={styles.dropdown}>
            <View style={styles.selectionField}>
              <RNPickerSelect
                onValueChange={(value) => setCollege(value)}
                items={collegeOptions}
                placeholder={{
                  label: "Select College",
                  value: null,
                  color: "gray",
                }}
                value={college}
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


          {loading ? (
            <ActivityIndicator></ActivityIndicator>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                handleSubmit();
              }}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "column",
    backgroundColor: "#000",
    flex: 1,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#505050",
    paddingHorizontal: 10,
    width: screenWidth * 0.8,
    height: 40,
    color: "white",
    backgroundColor: "#1f1e1e",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  selectionField: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    marginTop: 60,
    width: screenWidth * 0.5,
    height: screenWidth * 0.1,
    borderColor: "#c2c2c2",
    borderWidth: 1,
    backgroundColor: "white",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  buttonText: {
    color: "black",
    fontWeight: "500",
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Raleway",
  },
});


export default GetProfileData;
