import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { Svg, Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const ChooseGroupType = ({ route }) => {


    const [selectedOption, setSelectedOption] = useState(null);
    const [theme, setTheme] = useState("");

    const theimageurl_1 = "https://assets.api.uizard.io/api/cdn/stream/e830ee5c-5c98-451d-8f5c-031aba571d6d.png"
    const theimageurl_2 = "https://assets.api.uizard.io/api/cdn/stream/d0caabc3-2a0a-4d17-b7ad-e34dd3d1c0b5.png"
    
    const navigation = useNavigation();

    const toggleRadio = (option) => {
        setSelectedOption(option); // Update selected option state
        const newTheme = option === 1 ? 1 : 2; // Determine the new theme based on the selected option
        setTheme(newTheme); // Update the theme state (optional, if used elsewhere)
        navigation.navigate("CreateGroup", { theme: newTheme }); // Navigate with the updated theme directly
    };
    

    return (
        <View style={styles.container}>
  {/* Back Button */}
  <TouchableOpacity
    style={styles.backIcon}
    onPress={() => navigation.navigate("Main", { screen: "chats" })}
  >
    <Svg width={15} height={15} viewBox="0 0 448 512">
      <Path
        fill="white"
        d="M447.1 256C447.1 273.7 433.7 288 416 288H109.3l105.4 105.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448s-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L109.3 224H416C433.7 224 447.1 238.3 447.1 256z"
      />
    </Svg>
  </TouchableOpacity>

  {/* Heading */}
  <Text style={styles.heading}>
    What type of group do you want to create?
  </Text>

  {/* Option 1 */}
  <TouchableOpacity
    style={styles.imageWrapper}
    onPress={() => {
      toggleRadio(1); // First action
      // navigation.navigate("CreateGroup", { theme: theme }); // Uncomment if needed
    }}
  >
    <View style={styles.imageContainerWrapper}>
      <ImageBackground
        source={{ uri: theimageurl_1 }}
        style={styles.imageContainer}
      />
    </View>
  </TouchableOpacity>

  {/* Option 2 */}
  <TouchableOpacity
    style={styles.imageWrapper}
    onPress={() => {
      toggleRadio(2); // First action
      // navigation.navigate("CreateGroup", { theme: theme }); // Uncomment if needed
    }}
  >
    <View style={styles.imageContainerWrapper}>
      <ImageBackground
        source={{ uri: theimageurl_2 }}
        style={styles.imageContainer}
      />
    </View>
  </TouchableOpacity>
</View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  heading: {
    color: "white",
    fontSize: 30,
    fontFamily: "Red Hat Display",
    fontWeight: "bold",
    lineHeight: 31,
    textAlign: "center",
    width: screenWidth * 0.8,
    marginTop: screenHeight > 800 ? 200 : 150,
    marginBottom: 60,
  },
  imageWrapper: {
    backgroundColor: "black",
  },
  radioButton: {
    position: "absolute",
    top: 20,
    left: 5,
    zIndex: 1,
    backgroundColor: "gray",
    borderRadius: 50,
  },
  radioContainer: {
    padding: 3,
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  radioChecked: {
    backgroundColor: "green",
  },
  radioUnchecked: {
    backgroundColor: "Grey",
  },
  imageContainer: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.32,
    resizeMode: "cover",
    borderRadius: 12,
    overflow: "hidden", // Ensures content respects the rounded corners
  },
  button: {
    backgroundColor: "transparent",
    borderColor: "yellow",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: 100,
    marginTop: 120,
    width: screenWidth * 0.5,
  },
  buttonText: {
    color: "black",
    fontSize: 15,
    fontFamily: "Poppins",
    fontWeight: "bold",
    outline: "none",
    color: "yellow",
  },
  imageContainerWrapper: {
    width: screenWidth * 0.87,
    height: screenWidth * 0.3,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden", // Ensures content respects the rounded corners
    marginVertical: 15,
    borderColor: "gray",
    borderWidth: 1,
  },
  backIcon: {
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: "#404040",
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
});

export default ChooseGroupType;
