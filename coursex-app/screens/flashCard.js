import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
  ActivityIndicator,
  Button,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import NetInfo from "@react-native-community/netinfo";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import useAxios from "../utils/useAxios";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const FlashCard = ({ route }) => {
  const { flashcard_id, group_id, username } = route.params;
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [show, setShow] = useState("Question");
  const [numcards, setNumCards] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [flashcards, setFlashcards] = useState([]);
  const api = useAxios();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const [loading, setLoading] = useState(false);
  const [networkLoad, setNetworkLoad] = useState(false);

  const flipAnimation = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const handleRelease = ({ nativeEvent }) => {
    if (nativeEvent.translationY < -100) {
      Animated.timing(translateY, {
        toValue: -screenHeight,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
        setShow("Question");
        translateY.setValue(0);
      });
    } else if (nativeEvent.translationY > 100) {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCardIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : flashcards.length - 1
        );
        setShow("Question");
        translateY.setValue(0);
      });
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSwipeGesture = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const [isFlipped, setIsFlipped] = useState(false);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const handleCardFlip = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
    setShow(show === "Question" ? "Answer" : "Question");
  };

  const getFlashCardInfo = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        setNetworkLoad(true);
        return;
      }
      setLoading(true);
      const response = await api.get(
        `${baseURL}/api/user/getFlashCard/${flashcard_id}`
      );
      setTitle(response.data.message.name);
      setCreator(response.data.message.creator);
      setNumCards(response.data.message.questions.length);
      const fetchedFlashcards = response.data.message.questions.map(
        (question, index) => ({
          question,
          answer: response.data.message.answers[index],
        })
      );
      setFlashcards(fetchedFlashcards);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setNetworkLoad(true);
    }
  }, [flashcard_id]);

  useEffect(() => {
    getFlashCardInfo();
  }, [flashcard_id]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#00ff00" />
        ) : (
          <>
            <View style={styles.topContainer}>
              <TouchableOpacity
                style={styles.backIcon}
                onPress={() => {
                  navigation.navigate("FlashCardList", {
                    id: group_id,
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
            <Text style={styles.heading}>Quiz Flashcards</Text>
            <Text style={styles.subheading}>{title}</Text>
            <Text
              style={{
                ...styles.subheading_2,
                color: "#00ff12",
                marginTop: 15,
                marginBottom: -2,
              }}
            >
              {numcards} Flashcards
            </Text>
            <Text style={styles.subheading_2}>Created by {creator}</Text>

            {flashcards.length > 0 && (
              <PanGestureHandler
                onGestureEvent={handleSwipeGesture}
                onEnded={handleRelease}
              >
                <Animated.View style={[{ transform: [{ translateY }] }]}>
                  <TouchableOpacity onPress={handleCardFlip}>
                    <Animated.View
                      style={[
                        styles.card,
                        { transform: [{ rotateY: frontInterpolate }] },
                      ]}
                    >
                      <TouchableOpacity style={styles.Button}>
                        <Text style={styles.ButtonText}>Question</Text>
                      </TouchableOpacity>
                      <Text style={styles.mainText}>
                        {flashcards[cardIndex].question}
                      </Text>
                    </Animated.View>

                    <Animated.View
                      style={[
                        styles.card,
                        styles.backCard,
                        { transform: [{ rotateY: backInterpolate }] },
                      ]}
                    >
                      <TouchableOpacity
                        style={{ ...styles.Button, backgroundColor: "#0093d5" }}
                      >
                        <Text style={{ ...styles.ButtonText, color: "white" }}>
                          Answer
                        </Text>
                      </TouchableOpacity>
                      <Text style={{ ...styles.mainText, color: "white" }}>
                        {flashcards[cardIndex].answer}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              </PanGestureHandler>
            )}
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    color: "#ffffff",
    fontSize: 24,
    marginBottom: 20,
    alignSelf: "center",
    fontFamily: "Red Hat Display",
    fontWeight: "bold",
  },
  subheading: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Red Hat Display",
    fontWeight: "400",
  },
  subheading_2: {
    color: "#c2c2c2",
    fontSize: 15,
    fontFamily: "Red Hat Display",
    fontWeight: "400",
  },
  card: {
    backgroundColor: "white",
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    justifyContent: "flex-start",
    alignItems: "center",
    borderRadius: 10,
    backfaceVisibility: "hidden",
    padding: 20,
    marginTop: 20,
    // position: "absolute",
  },
  backCard: {
    backgroundColor: "#09acf6",
    position: "absolute",
  },
  mainText: {
    fontSize: 24,
    textAlign: "center",
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
  Button: {
    width: screenWidth * 0.3,
    height: 30,
    borderRadius: 100,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 70,
    marginBottom: 80,
  },
  ButtonText: {
    color: "black",
    fontSize: 13,
    fontFamily: "Red Hat Display",
    fontWeight: "400",
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
});

export default FlashCard;
