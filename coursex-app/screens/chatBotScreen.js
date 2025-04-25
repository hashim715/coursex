import React, { useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LogBox } from "react-native";
import { useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAxios from "../utils/useAxios";
import { useSelector } from "react-redux";
import YoutubeIcon from "./bottomIcons/youtubeIcon";
import SummaryIcon from "./bottomIcons/summaryIcon";
import DocumentIcon from "./bottomIcons/documentIcon";
import WebIcon from "./bottomIcons/webIcon";
import CourseIcon from "./bottomIcons/courseIcon";
import SubmitIcon from "./bottomIcons/submitIcon";
import BackIcon from "./bottomIcons/backIcon";
import { useFocusEffect } from "@react-navigation/native";

LogBox.ignoreAllLogs(true);

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const ChatbotScreen = ({ route }) => {
  const { option, webPageUrl, youtubeUrl, document_url } = route.params;
  const navigation = useNavigation();
  const [username, setUserName] = useState("");
  const [helperName, setHelperName] = useState("Sage");
  const socket = useSelector((state) => state.socket.instance);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const lineHeight = 20;
  const maxLines = 3;
  const maxHeight = lineHeight * maxLines;
  const [inputHeight, setInputHeight] = useState(30);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageGoing, setMessageGoing] = useState(false);
  const [taskType, setTaskType] = useState("");
  const api = useAxios();

  const getUserName = async () => {
    try {
      const value = await AsyncStorage.getItem("username");
      if (value !== null) {
        setUserName(value);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getUserName();
  }, []);

  const scrollViewRef = useRef();

  const handleContentSizeChangeText = (e) => {
    const newHeight = e.nativeEvent.contentSize.height;
    setInputHeight(Math.min(maxHeight, newHeight));
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  };

  const handleContentSizeChange = () => {
    scrollToBottom();
  };

  const handleJoinRoom = useCallback(() => {
    if (socket) {
      socket.emit("join-chatbot-room", {
        groupID: username + socket.id,
        username: username,
      });
    }
  }, [username, option]);

  const handleLeftRoom = useCallback(() => {
    if (socket) {
      socket.emit("leave-chatbot-room", {
        groupID: username + socket.id,
        username: username,
      });
    }
  }, [username, option]);

  useFocusEffect(
    useCallback(() => {
      handleJoinRoom();

      return () => {
        handleLeftRoom();
      };
    }, [navigation, username, socket])
  );

  useFocusEffect(
    useCallback(() => {
      const handleMessage = async (msg) => {
        if (username !== msg.sender) {
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];

            const existingMessageIndex = updatedMessages.findIndex(
              (message) => message.message_id === msg.message_id
            );

            if (existingMessageIndex !== -1) {
              if (msg.isFinal) {
                const lineToRemove = "Chatbot is typing...";
                updatedMessages[existingMessageIndex].message = updatedMessages[
                  existingMessageIndex
                ].message.replace(lineToRemove + "\n", "");
              } else {
                updatedMessages[existingMessageIndex].message =
                  updatedMessages[existingMessageIndex].message + msg.message;
              }
            } else {
              updatedMessages.push({
                ...msg,
                message: msg.message + "\n",
              });
            }
            return updatedMessages;
          });
        }
      };

      const handleDisconnect = () => {
        navigation.navigate("Main", { screen: "discover" });
      };

      if (socket) {
        socket.on("personal-chatbot-message", handleMessage);
        socket.on("disconnect", handleDisconnect);
      }

      return () => {
        if (socket) {
          socket.off("personal-chatbot-message", handleMessage);
          socket.off("disconnect", handleDisconnect);
        }
      };
    }, [username, option])
  );

  const getWebPageSummary = async (webPageUrl) => {
    try {
      const response = await api.post(`${baseURL}/api/ai/getWebPageSummary/`, {
        webPageUrl: webPageUrl,
      });
      return response.data.message;
    } catch (err) {
      Alert.alert("this webPage can not be summarized");
      return null;
    }
  };

  const getYouTubeSummary = async (youtubeUrl) => {
    try {
      const response = await api.post(`${baseURL}/api/ai/getYoutubeSummary/`, {
        youtubeUrl: youtubeUrl,
      });
      return response.data.message;
    } catch (err) {
      Alert.alert("Transcript unavailable for this video");
      return null;
    }
  };

  const getDocumentSummary = async (document_url) => {
    try {
      const response = await api.post(`${baseURL}/api/ai/getDocumentSummary/`, {
        document_url: document_url,
      });
      return response.data.message;
    } catch (err) {
      Alert.alert("Document Summary unavailable for this pdf");
      return null;
    }
  };

  let the_messages = [];

  const setDefaultMessage = useCallback(async () => {
    setLoading(true);
    if (option === "Summarizing a YouTube video") {
      const youtubeSummary = await getYouTubeSummary(youtubeUrl);
      if (youtubeSummary) {
        the_messages = [
          {
            sender: "Sage",
            message: `Hey i am your personal assistant this is your summary now you can ask any question you want related to this:\n\n ${youtubeSummary}`,
            type: "text",
            timeStamp: new Date().getTime(),
            taskType: "geminiChat",
          },
        ];
      } else {
        navigation.navigate("Main", { screen: "discover" });
      }
      setTaskType("geminiChat");
    } else if (option === "Getting a web page summary") {
      const webPageSummary = await getWebPageSummary(webPageUrl);
      if (webPageSummary) {
        the_messages = [
          {
            sender: "Sage",
            message: `Hey i am your personal assistant this is your summary now you can ask any question you want related to this:\n\n ${webPageSummary}`,
            type: "text",
            timeStamp: new Date().getTime(),
            taskType: "geminiChat",
          },
        ];
      } else {
        navigation.navigate("Main", { screen: "discover" });
      }
      setTaskType("geminiChat");
    } else if (option === "Learning from a document") {
      const documentSummary = await getDocumentSummary(document_url);
      if (document_url && documentSummary) {
        the_messages = [
          {
            sender: "Sage",
            message: `Hey i am your personal assistant this is your summary now you can ask any question you want related to this:\n\n ${documentSummary}`,
            type: "text",
            timeStamp: new Date().getTime(),
            taskType: "documentChat",
          },
        ];
      } else {
        navigation.navigate("Main", { screen: "discover" });
      }
      setTaskType("documentChat");
    } else if (option === "Searching the web") {
      the_messages = [
        {
          sender: "Sage",
          message: `Hello, I am Sage, your personal assistant. I can help you search the web for information. Feel free to ask me any questions.`,
          type: "text",
          timeStamp: new Date().getTime(),
          taskType: "webChat",
        },
      ];
      setTaskType("webChat");
    }
    setMessages(the_messages);
    setLoading(false);
  }, [option]);

  useEffect(() => {
    setDefaultMessage();
  }, [option]);

  const handleSubmit = (type) => {
    setMessageGoing(true);
    if (socket) {
      if (message.length > 0 && message.trim() !== "") {
        let complete_message = {
          sender: username,
          message: message,
          timeStamp: new Date().getTime(),
          group_id: username + socket.id,
          type: type,
          taskType: taskType,
          message_id: 0,
          previousChat: messages[0].message,
          document_url: document_url,
          chat_history:
            messages.length > 4
              ? messages.slice(-4).map((message) => message.message)
              : messages.slice(1, 4).map((message) => message.message),
        };
        setMessages([...messages, complete_message]);
        complete_message.message_id = messages.length;
        socket.emit("personal-chatbot-message", complete_message);
        setMessage("");
        scrollToBottom();
      }
    }
    setMessageGoing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topContainer}>
        <View style={styles.top_container_left}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Main", { screen: "discover" })}
            style={{ marginRight: 5 }}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.heading}>{helperName}</Text>
        </View>

        <View style={styles.top_container_center}>
          {option === "Summarizing a YouTube video" ? (
            <YoutubeIcon />
          ) : option === "Getting a web page summary" ? (
            <SummaryIcon />
          ) : option === "Learning from a document" ? (
            <DocumentIcon />
          ) : option === "Asking about a college course" ? (
            <CourseIcon />
          ) : (
            <WebIcon />
          )}
        </View>
        <View style={styles.top_container_right}>
          <Text style={styles.heading_2}>{option}</Text>
        </View>
      </View>

      {loading ? (
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "90%",
          }}
        >
          <ActivityIndicator></ActivityIndicator>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "black" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
        >
          <View style={{ flex: 1, backgroundColor: "black" }}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{
                flexGrow: 1,
                backgroundColor: "black",
                justifyContent: "flex-end",
                width: "95%",
                marginLeft: "2.5%",
                backgroundColor: "black",
              }}
              onContentSizeChange={handleContentSizeChange}
              style={{
                flex: 1,
              }}
              keyboardDismissMode="on-drag"
            >
              {messages.map((item, index) => {
                if (item.type === "text") {
                  return (
                    <Pressable
                      key={index}
                      style={[
                        item.sender === username
                          ? {
                              alignSelf: "flex-end",
                              backgroundColor: "black",
                              padding: 8,
                              maxWidth: "90%",
                              borderRadius: 7,
                              margin: 3,
                            }
                          : {
                              alignSelf: "flex-start",
                              backgroundColor: "black",
                              padding: 8,
                              margin: 3,
                              borderRadius: 7,
                              maxWidth: "90%",
                            },
                      ]}
                    >
                      <View style={styles.senderDetails}>
                        <Image
                          source={{
                            uri:
                              item.sender === username
                                ? "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
                                : "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
                          }}
                          style={styles.senderImage}
                        />
                        <Text style={styles.senderName}>
                          {item.sender === username ? "You" : item.sender}
                        </Text>

                        <Text
                          style={{
                            textAlign: "left",
                            fontSize: 9,
                            color: "gray",
                            marginTop: -15,
                            marginLeft: 10,
                          }}
                        ></Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 15,
                          color: "white",
                          marginLeft: 45,
                          marginTop: -22,
                        }}
                      >
                        {item?.message}
                      </Text>
                    </Pressable>
                  );
                }
              })}
            </ScrollView>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.inputbox, { height: Math.max(40, inputHeight) }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message"
              placeholderTextColor="gray"
              multiline={true}
              onContentSizeChange={handleContentSizeChangeText}
            />

            <Pressable
              onPress={() => handleSubmit("text")}
              style={styles.sendButton}
              disabled={messageGoing ? true : false}
            >
              {messageGoing ? (
                <ActivityIndicator></ActivityIndicator>
              ) : (
                <SubmitIcon />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
  },
  heading: {
    color: "#ffffff",
    fontSize: 30,
    fontFamily: "Red Hat Display",
    fontWeight: "bold",
  },
  heading_2: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Red Hat Display",
    fontWeight: "500",
  },
  zeroContainer: {
    width: screenWidth * 0.9,
    height: 20,
    justifyContent: "flex-start",
    alignSelf: "center",
    flexDirection: "row",
  },
  topContainer: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.1,
    justifyContent: "flex-start",
    alignSelf: "center",
    flexDirection: "row",
  },
  top_container_left: {
    width: screenWidth * 0.27,
    height: screenHeight * 0.1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "center",
  },
  top_container_center: {
    width: screenWidth * 0.1,
    height: screenHeight * 0.1,
    justifyContent: "center",
    alignSelf: "center",
  },
  top_container_right: {
    width: screenWidth * 0.5,
    height: screenHeight * 0.1,
    justifyContent: "center",
    alignSelf: "center",
  },
  card: {
    width: screenWidth * 0.42,
    height: screenWidth * 0.4,
    borderRadius: 20,
    marginTop: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.9,
    borderWidth: 1,
  },
  boxText: {
    fontSize: 16,
    fontFamily: "Red Hat Display",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 5,
  },
  senderImage: {
    width: 35,
    height: 35,
    borderRadius: 100000,
    borderWidth: 2,
    borderColor: "white",
    marginLeft: 5,
  },
  senderName: {
    color: "#fef80e",
    fontSize: 13,
    fontFamily: "Raleway",
    fontWeight: "bold",
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -15,
  },
  senderDetails: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginLeft: -5,
    marginBottom: 5,
  },
  inputContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    width: screenWidth * 0.9,
    height: screenWidth * 0.3,
    alignSelf: "center",
    position: "absolute",
  },
  inputWrapper: {
    width: screenWidth * 0.9,
    paddingHorizontal: 5,
    elevation: 3,
    backgroundColor: "black",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 20,
    alignSelf: "center",
  },
  inputbox: {
    borderWidth: 0,
    fontSize: 17,
    padding: 9,
    flex: 1,
    marginLeft: 5,
    lineHeight: 20,
    color: "white",
    fontFamily: "Raleway",
  },
  sendButton: {
    width: 30,
    height: 30,
    backgroundColor: "#0451f8",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatbotScreen;
