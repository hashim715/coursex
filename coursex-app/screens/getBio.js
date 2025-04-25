import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  Dimensions,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { useSelector } from "react-redux";
import useAxios from "../utils/useAxios";
import { useFocusEffect } from "@react-navigation/native";
import { s3 } from "../utils/aws-sdk-config";

const screenWidth = Dimensions.get("window").width;

const GetBio = ({ route }) => {
  const { data } = route.params;

  const [bio, setBio] = useState("");
  const navigation = useNavigation();
  const baseURL = useSelector((state) => state.baseUrl.url);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const api = useAxios();
  const [loading, setLoading] = useState(false);
  const [profile_data, setProfileData] = useState(null);
  const [networkLoad, setnetworkLoad] = useState(false);

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
      Alert.alert("Please retry or check your internet connection...");
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
      setProfileData(response.data.message);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        handleNetworkError();
      } else {
        handleNetworkError();
      }
    }
  }, []);

  useEffect(() => {
    getUserInfo();
  }, []);

  const uploadPicturestos3 = async (image) => {
    let imageUrl = "";
    if (!image.uri) {
      return null;
    }
    try {
      setLoading(true);
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const params = {
        Bucket: "w-groupchat-images",
        Key: `${Date.now()}_${image.fileName}`,
        Body: blob,
        ContentType: image.type || "image/jpeg",
      };
      const s3Response = await s3.upload(params).promise();
      imageUrl = s3Response.Location;
      setLoading(false);
      return imageUrl;
    } catch (err) {
      console.log(err);
      setLoading(false);
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
      let profile_image = data.profile_image;
      if (profile_image.uri) {
        profile_image = await uploadPicturestos3(profile_image);
        if (profile_image === null) {
          return;
        }
      }
      let form = {
        ...data,
        bio: bio,
        cover_image: profile_data.cover_image,
        theme: profile_data.theme,
        theme_color: profile_data.theme_color,
        profile_image: profile_image,
        name: profile_data.name,
      };
      const respone = await api.post(
        `${baseURL}/api/user/updateUserInfo/`,
        form
      );
      setLoading(false);
      navigation.navigate("Main", { screen: "chats" });
      Alert.alert("Profile info saved successfully");
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  const retryfetch = () => {
    setnetworkLoad(false);
    getUserInfo();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {networkLoad ? (
        <View
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button title="Refresh" onPress={() => retryfetch()}></Button>
        </View>
      ) : (
        <SafeAreaView style={style.container}>
          <Text style={style.heading}>
            Add a bio or{"\n"}mention your socials.
          </Text>
          <Text
            style={{
              ...style.heading,
              fontSize: 12,
              color: "#c2c2c2",
              width: screenWidth * 0.7,
              fontWeight: "300",
              marginTop: 20,
            }}
          >
            you seem fun. its time you write something cool in your bio or maybe
            just mention your instagram/snapchat for ppl to follow.
          </Text>
          <TextInput
            style={style.input}
            onChangeText={(text) => setBio(text)}
            value={bio}
            placeholder="Ex. Life is good, insta: @aazarjan"
            placeholderTextColor={"gray"}
            multiline={true}
          />
          {loading ? (
            <ActivityIndicator></ActivityIndicator>
          ) : (
            <TouchableOpacity
              style={style.button}
              onPress={() => handleSubmit()}
            >
              <Text style={style.buttonText}>Next</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      )}
    </TouchableWithoutFeedback>
  );
};

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  heading: {
    marginTop: 28,
    color: "#ffffff",
    fontSize: 25,
    fontFamily: "Raleway",
    fontWeight: "bold",
    textAlign: "center",
    width: screenWidth * 0.8,
    justifyContent: "center",
    marginTop: 50,
  },
  button: {
    marginTop: 200,
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
  input: {
    width: screenWidth * 0.9,
    height: 150,
    paddingHorizontal: 10,
    boxSizing: "border-box",
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#1f1e1e",
    borderColor: "$151515",
    color: "white",
    fontSize: 13,
    fontFamily: "Raleway",
    fontWeight: "500",
    marginTop: 60,
    marginBottom: 10,
    textAlignVertical: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
});

export default GetBio;
