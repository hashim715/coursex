import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import NetInfo from "@react-native-community/netinfo";
import useAxios from "../utils/useAxios";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const screenWidth = Dimensions.get("window").width;

export const CreateFlash = ({ route }) => {
  const { id, username } = route.params;
  const [title, setTitle] = useState("");
  const [flashcards, setFlashcards] = useState([{ question: "", answer: "" }]);
  const [loading, setLoading] = useState(false);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const navigation = useNavigation();
  const baseURL = useSelector((state) => state.baseUrl.url);
  const api = useAxios();

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const updateFlashCard = (index, field, value) => {
    const newFlashcards = [...flashcards];
    newFlashcards[index][field] = value;
    setFlashcards(newFlashcards);
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
      const questions = [];
      const answers = [];
      flashcards.forEach((flashcard) => {
        questions.push(flashcard.question);
        answers.push(flashcard.answer);
      });
      const data = {
        name: title,
        questions: questions,
        answers: answers,
      };
      const response = await api.post(
        `${baseURL}/api/user/createFlashCard/${id}`,
        data
      );
      setTitle("");
      setFlashcards([{ question: "", answer: "" }]);
      setLoading(false);
      Alert.alert("FlashCard created successfully");
      navigation.navigate("FlashCardList", {
        id: id,
        date: new Date().toString(),
        username: username,
      });
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  const renderFlashCards = () => {
    return flashcards.map((flashcard, index) => (
      <View key={index} style={styles.outer_card}>
        <TouchableOpacity
          style={styles.removeIcon}
          onPress={() => {
            const newFlashcards = [...flashcards];
            newFlashcards.splice(index, 1);
            setFlashcards(newFlashcards);
          }}
        >
          <Svg viewBox="0 0 24 24" width={15} height={15}>
            <Path d="M0 0h24v24H0z" fill="none"></Path>
            <Path fill="white" d="M19 13H5v-2h14v2z"></Path>
          </Svg>
        </TouchableOpacity>
        <View key={index} style={styles.card}>
          <TextInput
            value={flashcard.question}
            onChangeText={(text) => updateFlashCard(index, "question", text)}
            style={{ ...styles.input_2, marginTop: 5 }}
            placeholderTextColor={"gray"}
            placeholder="Question/Term"
          />
          <TextInput
            value={flashcard.answer}
            onChangeText={(text) => updateFlashCard(index, "answer", text)}
            style={styles.input_2}
            placeholderTextColor={"gray"}
            placeholder="Answer/Definition"
          />
        </View>
      </View>
    ));
  };

  const addFlashCard = () => {
    setFlashcards([...flashcards, { question: "", answer: "" }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topContainer}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => {
            navigation.navigate("GroupMembers", {
              id: id,
              username: username,
            });
          }}
        >
          <Svg width={15} height={15} viewBox="0 0 448 512">
            <Path
              fill="white"
              d="M447.1 256C447.1 273.7 433.7 288 416 288H109.3l105.4 105.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448s-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L109.3 224H416C433.7 224 447.1 238.3 447.1 256z"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>
        Create a Quiz <Text style={{ color: "#00FF12" }}>Flashcard</Text> Set
      </Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholderTextColor={"gray"}
        placeholder="Name (Chapter, Module, Unit)"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0} // Adjust this value as needed
        style={{ flex: 1, marginBottom: 1 }}
      >
        <ScrollView
          style={styles.flashcardContainer}
          keyboardDismissMode="on-drag"
        >
          {renderFlashCards()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.addButton} onPress={addFlashCard}>
          <Svg viewBox="0 0 24 24" width="24" height="24">
            <Path d="M0 0h24v24H0z" fill="none" />
            <Path fill="black" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </Svg>
        </TouchableOpacity>
      </View>

      <View
        style={{
          ...styles.bottomContainer,
          bottom: 10,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <TouchableOpacity style={styles.uploadButton} onPress={handleSubmit}>
          {loading ? (
            <ActivityIndicator></ActivityIndicator>
          ) : (
            <Text style={styles.uploadText}>Upload</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    padding: 20,
    alignItems: "center",
  },
  topContainer: {
    position: "absolute",
    top: 10,
    display: "flex",
    flexDirection: "row",
    width: screenWidth * 0.95,
    height: screenWidth * 0.3,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 80,
    display: "flex",
    flexDirection: "row",
    width: screenWidth * 0.95,
    height: screenWidth * 0.3,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  backIcon: {
    borderRadius: 10,
    width: 40,
    height: 40,
    borderRadius: 50000,
    backgroundColor: "#404040",
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 50,
    fontFamily: "Red Hat Display",
  },
  flashcardContainer: {
    marginTop: 20,
    width: screenWidth * 0.9,
  },
  card: {
    backgroundColor: "#151515",
    width: screenWidth * 0.87,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginBottom: 10,
    height: 120,
    alignSelf: "center",
  },
  outer_card: {
    backgroundColor: "transparent",
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
    height: 160,
    alignSelf: "center",
  },
  input: {
    width: screenWidth * 0.87,
    height: screenWidth * 0.1,
    padding: screenWidth * 0.03,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#505050",
    color: "white",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: "250",
    borderRadius: 10,
    marginBottom: 10,
  },
  input_2: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.1,
    padding: screenWidth * 0.03,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#505050",
    color: "white",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: "250",
    borderRadius: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#00FF12",
    width: 50,
    height: 50,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    backgroundColor: "white",
    width: screenWidth * 0.4,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    color: "black",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: "500",
  },
  removeIcon: {
    position: "absolute",
    top: 5, // Moves the icon up so that half is outside
    right: 20, // Moves the icon to the right, so it's half outside the corner
    backgroundColor: "#d70900",
    zIndex: 1,
    width: 20, // Size of the icon
    height: 20, // Size of the icon
    borderRadius: 15, // Ensures the icon is circular
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CreateFlash;
