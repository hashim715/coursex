import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  FlatList,
  Button,
  ActivityIndicator,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import useAxios from "../utils/useAxios";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const FlashCardList = ({ route }) => {
  const { id, date, username } = route.params;
  const [loading, setLoading] = useState(false);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const navigation = useNavigation();
  const baseURL = useSelector((state) => state.baseUrl.url);
  const api = useAxios();
  const [networkLoad, setnetworkLoad] = useState(false);
  const [flashcards, setflashcards] = useState([]);

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
      Alert.alert(
        "Something went wrong",
        "Please retry or check your internet connection..."
      );
    }
  };

  const getFlashcards = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError();
        return;
      }
      setLoading(true);
      const response = await api.get(`${baseURL}/api/user/getFlashcards/${id}`);
      setflashcards(response.data.message);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        handleNetworkError();
      } else {
        handleNetworkError();
      }
    }
  }, [id]);

  useEffect(() => {
    getFlashcards();
  }, [id, date]);

  const renderFlashCard = (flashCard) => {
    return (
      <TouchableOpacity
        style={styles.flashCard}
        onPress={() => {
          navigation.navigate("FlashCard", {
            group_id: id,
            flashcard_id: flashCard.id,
            username,
          });
        }}
      >
        <Text style={styles.flashHeading}>{flashCard.name}</Text>
        <Text style={{ ...styles.subheading, color: "#00ff12" }}>
          {flashCard.questions.length} cards
        </Text>
        <Text style={styles.subheading}>Created by {flashCard.creator}</Text>
      </TouchableOpacity>
    );
  };

  const retryfetch = () => {
    setnetworkLoad(false);
    getFlashcards();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topContainer}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => {
            navigation.navigate("GroupMembers", {
              username: username,
              id: id,
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
      <Text style={styles.heading}>Quiz Flashcards</Text>

      {networkLoad ? (
        <View style={styles.contentContainer}>
          <Button title="Refresh" onPress={() => retryfetch()}></Button>
        </View>
      ) : loading ? (
        <View style={styles.contentContainer}>
          <ActivityIndicator></ActivityIndicator>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <FlatList
            data={flashcards}
            renderItem={({ item }) => renderFlashCard(item)}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.cardList}
            showsVerticalScrollIndicator={false}
          />
          {/* Button below the list */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => {
              navigation.navigate("CreateFlash", {
                id: id,
                username: username,
              });
            }}
          >
            <Text style={styles.createButtonText}>Create a New One</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between", // Make sure the FlatList and the button are spaced correctly
    alignItems: "center",
    width: screenWidth,
    paddingBottom: 20,
  },
  flashCard: {
    width: screenWidth * 0.9,
    // height: 100,
    maxHeight: 200,
    backgroundColor: "#151515",
    borderRadius: 10,
    borderColor: "#505050",
    borderWidth: 1,
    marginVertical: 8,
    justifyContent: "flex-start",
    padding: 15,
  },
  flashHeading: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Red Hat Display",
    fontWeight: "500",
    marginBottom: 10,
  },
  topContainer: {
    position: "absolute",
    top: 10,
    left: screenWidth * 0.05,
    display: "flex",
    flexDirection: "row",
    width: screenWidth * 0.95,
    height: screenWidth * 0.3,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  heading: {
    color: "#ffffff",
    fontSize: 24,
    fontFamily: "Red Hat Display",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 50,
  },
  subheading: {
    color: "#c2c2c2",
    fontSize: 13,
    fontFamily: "Red Hat Display",
    fontWeight: "350",
    marginBottom: 3,
  },
  cardList: {
    paddingBottom: 50,
    alignItems: "center",
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: "#404040",
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  createButton: {
    backgroundColor: "#1a73e8",
    width: screenWidth * 0.9,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default FlashCardList;
