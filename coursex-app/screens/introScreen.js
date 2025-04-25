import React, { useEffect } from "react";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { LogBox } from "react-native";
import logo from "../assets/app_logo.png";

LogBox.ignoreAllLogs(true);

const screenWidth = Dimensions.get("window").width;

const IntroScreen = () => {
  const navigation = useNavigation();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        navigation.navigate("Main", { screen: "chats" });
      } else {
        navigation.navigate("ChooseLoginType");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.imageContainer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  imageContainer: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    borderRadius: 8,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
  },
});

export default IntroScreen;
