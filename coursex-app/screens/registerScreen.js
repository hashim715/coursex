import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Alert,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import React, { useState, useRef } from "react";
import CheckBox from "expo-checkbox";
import { LogBox } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";
import { Linking } from "react-native";

LogBox.ignoreAllLogs(true);

const screenWidth = Dimensions.get("window").width;
LogBox.ignoreAllLogs();

const RegisterScreen = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(["", "", "", "", "", "","","","",""]);
  const inputRefs = useRef([]); // Array of refs for input fields
  // const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const [isAbove18, setIsAbove18] = useState(false);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        navigation.navigate("Main", { screen: "chats" });
      }
    }, [isLoggedIn])
  );

  const handleChangeText = (text, index) => {
    const newPhone = [...phone];
    newPhone[index] = text;
    setPhone(newPhone);

    if (text && index < phone.length - 1) {
      // Move to the next input if it exists
      inputRefs.current[index + 1]?.focus();
    }
  };

  const validatePhone = (phone) => {
    const re = /^[0-9\b]+$/;
    return re.test(phone);
  };

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Please provide valid inputs");
      return;
    }

    if (password.trim().length < 8) {
      Alert.alert("Password should be at least of 8 characters");
      return;
    }

    if (!email.trim().endsWith(".edu")) {
      Alert.alert("Only .edu email addresses are allowed.");
      return;
    }

    const user = {
      name: name.trim(),
      // username should be the name before the first space and should not contain any special characters
      username: name.trim().split(" ")[0].replace(/[^a-zA-Z0-9]/g, ""),
      email: email.trim(),
      password: password.trim(),
    };

    

    if (!isAbove18) {
      Alert.alert(
        "Please confirm you are above 18 years old and agree to the terms and conditions."
      );
      return;
    }
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "There might be an issue with your internet connection try again..."
        );
        return;
      }
      setLoading(true);
      const response = await axios.post(`${baseURL}/api/user/register/`, user);
      setName("");
      setPassword("");
      setLoading(false);
      navigation.navigate("verificationScreen", {
        email: user.email,
        screen: "verify",
      });
      setEmail("");
      Alert.alert("Verification code has been sent to your email");
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
        >
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Text style={styles.title}>Lets get started.</Text>
          </View>

          <View style={{ marginTop: 50, marginBottom: 5 }}>

            <View style={{ marginBottom: 13 }}>
              <TextInput
                value={name}
                onChangeText={(text) => {
                  if (text.trim().length > 25) {
                    Alert.alert(
                      "Name should not contain more than 25 characters"
                    );
                  } else {
                    setName(text);
                  }
                }}
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={"gray"}
              />
            </View>

            <Text style={{...styles.checkboxLabel, alignSelf: "left", marginBottom: 10, marginLeft:0}}>
              Enter you 9 digit phone number
            </Text>

            <View style={styles.codeInputContainer}>
              {phone.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)} // Assign ref to each input
                  value={digit}
                  onChangeText={(text) => handleChangeText(text, index)}
                  style={styles.inputCode}
                  keyboardType="numeric"
                  maxLength={1}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // Focus next input on pressing return
                    if (index < phone.length - 1) {
                      inputRefs.current[index + 1]?.focus();
                    }
                  }}
                />
              ))}
            </View>


            <View style={styles.checkboxContainer}>
              <CheckBox
                disabled={false}
                value={isAbove18}
                onValueChange={setIsAbove18}
              />
              <Text style={styles.checkboxLabel}>I am over the age of 4</Text>
            </View>

            <View
              style={{
                width: screenWidth * 0.8,
                height: screenWidth * 0.3,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  ...styles.checkboxLabel,
                  fontSize: 10,
                  width: screenWidth * 0.5,
                }}
              >
                By continuing, I agree to the{" "}
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL(
                      "https://www.coursex.com/privacy"
                    )
                  }
                >
                  privacy policy
                </Text>
                ,
                <Text
                  style={styles.link}
                  onPress={() =>
                    Linking.openURL("https://www.coursex.us/terms")
                  }
                >
                  terms and conditions
                </Text>
                .
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator></ActivityIndicator>
            ) : (
              <TouchableOpacity
                onPress={handleRegister}
                style={styles.registerButton}
              >
                <Text style={styles.registerButtonText}>Lesgooo</Text>
              </TouchableOpacity>
            )}

            <Pressable
              onPress={() => navigation.navigate("Login")}
              style={{ marginTop: 15 }}
            >
              <Text style={styles.loginText}>
                or <Text style={styles.loginTextBold}>log into my account</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "Raleway",
    fontWeight: "bold",
    textAlign: "center",
  },
  label: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: "bold",
    textAlign: "justify",
    marginBottom: 5,
  },
  input: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.1,
    padding: screenWidth * 0.03,
    border: "0",
    boxSizing: "border-box",
    borderRadius: 10,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#505050",
    color: "white",
    fontSize: 13,
    fontFamily: "Raleway",
    fontWeight: "500",
    outline: "none",
  },
  checkboxContainer: {
    flexDirection: "row",
    marginBottom: 10,
    marginTop: 10,
    alignItems: "center",
  },
  checkbox: {
    alignSelf: "center",
  },
  checkboxLabel: {
    marginLeft: 8,
    color: "#c2c2c2",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: 500,
    textAlign: "center",
  },
  link: {
    fontWeight: "bold",
    color: "#c2c2c2",
  },
  registerButton: {
    marginTop: -20,
    cursor: "pointer",
    width: screenWidth * 0.7,
    height: screenWidth * 0.1,
    padding: 8,
    border: "1px solid #fef80e",
    boxSizing: "border-box",
    borderRadius: 100000,
    boxShadow: "0px 0px 10px rgba(0,0,0,0.1)",
    backgroundColor: "white",
    lineHeight: 16,
    outline: "none",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    textAlign: "center",
  },
  registerButtonText: {
    fontSize: 18,
    fontFamily: "Raleway",
    fontWeight: "500",
    textAlign: "center",
    color: "black",
  },
  loginText: {
    color: "#7f7f7f",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 25,
  },
  loginTextBold: {
    //fontWeight: "bold",
    color: "white",
  },
  scrollView: {
    width: screenWidth,
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: screenWidth * 0.8,
    marginBottom: 10,
  },
  inputCode: {
    width: 30,
    height: 30,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#505050",
    color: "white",
    fontSize: 20,
    textAlign: "center",
    borderRadius: 10,
  }
});
