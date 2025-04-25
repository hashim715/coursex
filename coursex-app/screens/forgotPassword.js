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

const ForgotPasswordScreen = ({ route }) => {
  const { email } = route.params;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

      if (password !== confirmPassword) {
        Alert.alert(
          "Please make sure password and confirm password should match"
        );
        return;
      }
      setLoading(true);
      const response = await axios.post(
        `${baseURL}/api/verify/forgotPassword/`,
        { email: email, password: password }
      );
      setLoading(false);
      Alert.alert("Your password was reset successfully");
      navigation.navigate("Login");
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
      <Text style={styles.instructionText}>Reset Your password.</Text>

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        style={[styles.input, { marginTop: 10 }]}
        placeholderTextColor={"black"}
        placeholder="your password goes here."
      />

      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={true}
        style={[styles.input, { marginTop: 10 }]}
        placeholderTextColor={"black"}
        placeholder="your confirm password goes here."
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

export default ForgotPasswordScreen;
