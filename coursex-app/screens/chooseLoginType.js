import React, { useState, useCallback } from "react";
import {
  LogBox,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";

import { useNavigation } from "@react-navigation/native";


const screenWidth = Dimensions.get("window").width;
LogBox.ignoreAllLogs();

const ChooseLoginType = () => {

    const navigation = useNavigation();
  
    return (
        <View style={styles.container}>
        <View style={styles.headerContainer}>
            <Text style={styles.headerText}>Welcome to CourseX.</Text>
        </View>

        <View style={styles.formContainer}>


            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Login")}>
                <Text style={styles.buttonText}>Sign in with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("LoginWithPhone")}>
                <Text style={styles.buttonText}>Sign in with Phone Number</Text>
            </TouchableOpacity>


            <Pressable
            onPress={() => navigation.navigate("Register")}
            style={{ marginTop: 15 }}
            >
            <Text style={styles.signupText}>
                or{" "}
                <Text style={{ color: "white", fontWeight: "500" }}>
                create an account
                </Text>
            </Text>
            </Pressable>
        </View>
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
    headerContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    headerText: {
      color: "#ffffff",
      fontSize: 30,
      fontFamily: "Red Hat Display",
      fontWeight: "bold",
    },
    formContainer: {
      marginTop: 50,
    },
    button: {
      marginTop: 10,
      width: screenWidth * 0.8,
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
      textAlign: "center",
      fontSize: 18,
      fontFamily: "Raleway",
      fontWeight: "500",
    },
    signupText: {
      textAlign: "center",
      color: "gray",
      fontSize: 15,
      marginTop: 20,
    },
  });
  
  
export default ChooseLoginType;