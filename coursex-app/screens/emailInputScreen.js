import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";

const screenWidth = Dimensions.get("window").width;

const EmailInputScreen = ({ route }) => {
  const { screen } = route.params;
  const [email, setEmail] = useState("");
  const baseURL = useSelector((state) => state.baseUrl.url);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        navigation.navigate("Main", { screen: "chats" });
      }
    }, [isLoggedIn])
  );

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
      const response = await axios.post(
        `${baseURL}/api/verify/sendForgotPasswordEmail/`,
        { email: email }
      );
      setLoading(false);
      Alert.alert("Verification code has been sent to your email");
      if (screen === "forgotPassword") {
        navigation.navigate("verificationScreen", {
          email: email,
          screen: "forgot",
        });
      } else {
        navigation.navigate("Login");
      }
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instructionText}>
        Please enter the email associated with your account.
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="gray"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        {loading ? (
          <ActivityIndicator></ActivityIndicator>
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    color: "white",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    width: screenWidth * 0.8,
  },
  input: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.1,
    backgroundColor: "#f5f6fa",
    color: "#000",
    fontSize: 16,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  button: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.1,
    backgroundColor: "#fef80e",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 18,
  },
});

export default EmailInputScreen;
