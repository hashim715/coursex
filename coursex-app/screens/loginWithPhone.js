import {
    StyleSheet,
    Text,
    View,
    TextInput,
    KeyboardAvoidingView,
    Pressable,
    Alert,
    Dimensions,
    SafeAreaView,
    Platform,
    ScrollView,
    ActivityIndicator,
  } from "react-native";
import React, { useState, useRef } from "react";
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
  
const LoginWithPhone = () => {
    const [phone, setPhone] = useState(["", "", "", "", "", "","","","",""]);
    const inputRefs = useRef([]); 
    
    const navigation = useNavigation();
    const baseURL = useSelector((state) => state.baseUrl.url);
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
    
  
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
            
  
            <View style={{ marginTop: 50, marginBottom: 5 }}>
  
            
  
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
  

  
              <Pressable
                style={{ marginTop: 15 }}
              >
                <Text style={styles.loginTextBold}>log into my account</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };
  
  export default LoginWithPhone;
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: "black",
      alignItems: "center",
      justifyContent: "center",
      flexGrow: 1,
    },
    checkboxLabel: {
      marginLeft: 8,
      color: "#c2c2c2",
      fontSize: 15,
      fontFamily: "Raleway",
      fontWeight: "500",
      textAlign: "center",
    },
    loginTextBold: {
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
    },
  });
  