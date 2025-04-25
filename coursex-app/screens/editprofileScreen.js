import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import RNPickerSelect from "react-native-picker-select";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import useAxios from "../utils/useAxios";
import { useSelector, useDispatch } from "react-redux";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import { ActivityIndicator } from "react-native-paper";
import NetInfo from "@react-native-community/netinfo";

const screenWidth = Dimensions.get("window").width;

const EditProfileScreen = () => {
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const [courses, setCourses] = useState("");
  const [loading, setLoading] = useState(false);
  const [theimageurl, settheImageUrl] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [submitLoad, setsubmitLoading] = useState(false);

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const baseURL = useSelector((state) => state.baseUrl.url);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const api = useAxios();

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const getUserInfo = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "Network Error",
          "There might be an issue with your internet connection try again..."
        );
      }
      setLoading(true);
      const response = await api.get(`${baseURL}/api/user/getuserinfo`);
      setName(response.data.message.name);
      settheImageUrl(response.data.message.image);
      setSelectedValue(response.data.message.college);
      setCourses(response.data.message.courses);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        Alert.alert(
          "Network Error",
          "Try again this may be due to your network."
        );
      } else {
        Alert.alert("Something went wrong");
      }
    }
  }, []);

  useEffect(() => {
    getUserInfo();
  }, [refresh]);

  const selectImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissions",
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        settheImageUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error in selecting image. Select again");
    }
  };

  const handleSubmit = async () => {
    let formData;
    if (image) {
      formData = new FormData();

      formData.append("name", name);
      formData.append("image", {
        uri: image.uri,
        name: "group.jpg",
        type: "image/jpeg",
      });
      formData.append("courses", JSON.stringify(courses));
      formData.append("college", selectedValue);
    } else {
      formData = {
        name: name,
        college: selectedValue,
        courses: JSON.stringify(courses),
      };
    }
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "Network Error",
          "There might be an issue with your internet connection try again..."
        );
      }
      setsubmitLoading(true);
      const response = await api.post(
        `${baseURL}/api/user/updateUserInfo/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
        }
      );
      setsubmitLoading(false);
      setRefresh(true);
      Alert.alert("Update", "You look amazing ! 🔥");
      dispatch(handleUseffectActions.setRefreshProfileScreen({ reload: true }));
      dispatch(
        handleUseffectActions.setRefreshSettingsScreen({ reload: true })
      );
      navigation.navigate("Main", { screen: "profile" });
    } catch (err) {
      setsubmitLoading(false);
      if (err.response.status === 503) {
        Alert.alert("Network Error", err.response.data.message);
      } else {
        Alert.alert("Something went wrong", err.response.data.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {loading ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
          >
            <ActivityIndicator></ActivityIndicator>
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
          >
            <TouchableOpacity>
              <Image source={{ uri: theimageurl }} style={styles.Circle} />
            </TouchableOpacity>

            <View>
              <TouchableOpacity onPress={selectImage}>
                <Text style={styles.selectText}>Select Image</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView>
              <KeyboardAvoidingView style={{ marginBottom: 5, marginTop: 20 }}>
                <Text style={styles.FieldText}>Name</Text>

                <TextInput
                  value={name}
                  onChangeText={(text) => setName(text)}
                  style={styles.TextBox}
                  placeholderTextColor={"white"}
                  placeholder={name}
                />
              </KeyboardAvoidingView>

              <View
                style={{
                  marginBottom: 5,
                  marginTop: 20,
                }}
              >
                <Text style={styles.FieldText}>school/college</Text>
                <View style={styles.dropdown}>
                  <RNPickerSelect
                    activeItemStyle={{ color: "black" }}
                    onValueChange={(value) => setSelectedValue(value)}
                    value={selectedValue}
                    items={[
                      {
                        label: "University of Houston-Downtown",
                        value: "University of Houston-Downtown",
                      },
                    ]}
                    placeholder={{
                      label: "Choose a University",
                      value: null,
                      color: "white",
                    }}
                    style={{
                      inputIOS: {
                        color: "white",
                      },
                      inputAndroid: {
                        color: "white",
                      },
                      placeholder: {
                        color: "white",
                      },
                    }}
                  />
                </View>
              </View>

              <KeyboardAvoidingView
                style={{
                  marginBottom: 8,
                  marginTop: 20,
                  marginRight: screenWidth * 0.65,
                }}
              >
                <Text style={{ ...styles.FieldText, fontWeight: "bold" }}>
                  Courses
                </Text>
              </KeyboardAvoidingView>

              {courses.map((course, idx) => {
                return (
                  <KeyboardAvoidingView style={{ marginBottom: 10 }} key={idx}>
                    <TextInput
                      value={course}
                      onChangeText={(text) => {
                        const updatedCourses = [...courses];
                        updatedCourses[idx] = text;
                        setCourses(updatedCourses);
                      }}
                      style={styles.TextBox}
                      placeholderTextColor={"white"}
                      placeholder={course}
                    />
                  </KeyboardAvoidingView>
                );
              })}
            </KeyboardAvoidingView>

            {submitLoad ? (
              <ActivityIndicator></ActivityIndicator>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Looks good ⚡️</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  scrollView: {
    backgroundColor: "black",
  },
  Circle: {
    width: 100,
    height: 100,
    backgroundColor: "white",
    borderRadius: 0.5 * 100,
  },
  selectText: {
    color: "#87CEEB",
    fontSize: 15,
    marginTop: 10,
  },
  TextBox: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.1,
    padding: screenWidth * 0.03,
    border: "0",
    boxSizing: "border-box",
    borderRadius: 12,
    backgroundColor: "#1f1e1e",
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "Montserrat",
    fontWeight: "500",
    lineHeight: 13,
    outline: "none",
  },
  FieldText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "justify",
    marginBottom: 10,
    fontWeight: "bold",
  },
  scrollView: {
    backgroundColor: "black",
  },
  submitButton: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.12,
    padding: screenWidth * 0.03,
    marginTop: 40,
    borderWidth: 1,
    borderColor: "#fef80e",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fef80e",
    fontSize: 13,
    fontFamily: "Raleway",
    fontWeight: "500",
    lineHeight: 17,
  },
  picker: {
    height: 40,
    color: "white",
    width: screenWidth * 0.7,
    height: screenWidth * 0.1,
    padding: screenWidth * 0.03,
    borderRadius: 15,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#1f1e1e",
    borderRadius: 12,
    height: 55,
    backgroundColor: "#1f1e1e",
    paddingHorizontal: 10,
    justifyContent: "center",
  },
});

export default EditProfileScreen;
