import React, { useEffect } from "react";
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
  FlatList,
  ActivityIndicator,
  Alert,
  Button,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LogBox } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useAxios from "../utils/useAxios";
import { useDispatch, useSelector } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import { useState, useRef } from "react";
import { useCallback } from "react";
import { Path, Svg } from "react-native-svg";
import Modal from "react-native-modal";
import { handleUseffectActions } from "../store/reducers/handleUseffect";

LogBox.ignoreAllLogs(true);

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const GroupChatbotScreen = ({ route }) => {
  const { id, username, type } = route.params;
  const navigation = useNavigation();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const socket = useSelector((state) => state.socket.instance);
  const refreshChatbotScreen = useSelector(
    (state) => state.handleUseffect.refreshChatbotScreen
  );
  const api = useAxios();
  const [networkLoad, setnetworkLoad] = useState(false);
  const [loadingImage, setLoadingImage] = useState(new Map());
  const [fetchData, setfetchData] = useState(new Map());
  const networkErrorRef = useRef(false);
  const lineHeight = 20;
  const maxLines = 3;
  const maxHeight = lineHeight * maxLines;
  const [inputHeight, setInputHeight] = useState(30);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageGoing, setMessageGoing] = useState(false);
  const [assistant_name, setAssitantName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [profile_pic, setProfilePic] = useState("");
  const [loading, setLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentDeleting, setDocumentDeleting] = useState(new Map());
  const dispatch = useDispatch();

  const handleNetworkError = (fetchEvent) => {
    setfetchData((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(`${fetchEvent}`, true);
      return newMap;
    });
    if (!networkErrorRef.current) {
      setnetworkLoad(true);
      networkErrorRef.current = true;
      Alert.alert(
        "Something went wrong",
        "Please retry or check your internet connection..."
      );
    }
  };

  const getDocuments = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError("documents");
        return;
      }

      setDocumentLoading(true);

      const response = await api.get(
        `${baseURL}/api/knowledgeBase/getAssistantDocuments/${assistantId}`
      );
      setDocuments(response.data.message);

      setDocumentLoading(false);
    } catch (e) {
      setDocumentLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("documents");
      } else {
        handleNetworkError("documents");
      }
    }
  }, [assistantId]);

  useEffect(() => {
    if (refreshChatbotScreen || assistantId) {
      getDocuments();
      dispatch(
        handleUseffectActions.setRefreshChatbotScreen({ reload: false })
      );
    }
  }, [assistantId, refreshChatbotScreen]);

  const deleteDocumentFromAssistant = async (file_id, id) => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "There might be an issue with your internet connection try again..."
        );
        return;
      }
      setDocumentDeleting((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`item-${id}`, true);
        return newMap;
      });
      const response = await api.post(
        `${baseURL}/api/knowledgeBase/deleteDocumentsFromAssistant/`,
        { file_id: file_id, assistantId: `${assistantId}`, id: `${id}` }
      );
      setDocumentDeleting((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`item-${id}`, false);
        return newMap;
      });
      getDocuments();
      toggleModal();
      Alert.alert("Document deleted successfully");
    } catch (err) {
      setDocumentDeleting((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`item-${id}`, false);
        return newMap;
      });
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  const renderDocument = ({ item }) => {
    return (
      <View>
        <View style={styles.memberCard}>
          <View style={styles.memberInnerLeft}>
            <View
              style={{
                position: "relative",
                width: 100,
                height: 100,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{
                  uri: "https://assets.api.uizard.io/api/cdn/stream/eb71bd6c-d651-4610-9528-b4126e652c44.png",
                }}
                style={styles.memberImage}
              />
            </View>
          </View>

          <View style={styles.memberInnerCenter}>
            <Text style={styles.memberName}>{item.name}</Text>
          </View>

        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "gray",
            width: screenWidth * 0.9,
            marginLeft: 20,
          }}
        ></View>
      </View>
    );
  };

  const handleContentSizeChangeText = (e) => {
    const newHeight = e.nativeEvent.contentSize.height;
    setInputHeight(Math.min(maxHeight, newHeight));
  };

  const getAssistantName = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError("assistant");
        return;
      }
      setLoading(true);
      const response = await api.get(
        `${baseURL}/api/user/getGroupAssistantName/${id}`
      );
      setAssitantName(response.data.message.chatbotName);
      setDisplayName(response.data.message.name);
      setAssistantId(response.data.message.id);
      setProfilePic("https://assets.api.uizard.io/api/cdn/stream/72aa7c72-8bd6-4874-b4ad-36a00b6d5bf2.png");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("assistant");
      } else {
        handleNetworkError("assistant");
      }
    }
  }, [id]);

  useEffect(() => {
    getAssistantName();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, []);

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
        groupID: username + socket.id + id,
        username: username,
      });
    }
  }, [username, id]);

  const handleLeftRoom = useCallback(() => {
    if (socket) {
      socket.emit("leave-chatbot-room", {
        groupID: username + socket.id + id,
        username: username,
      });
    }
  }, [username, id]);

  useEffect(() => {
    handleJoinRoom();
  }, [username, id]);

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

          if (msg.isFinal) {
          }
        }
      };

      const handleDisconnect = () => {
        navigation.navigate("GroupMembers", {
          id: id,
          username: username,
        });
      };

      if (socket) {
        socket.on("group-chatbot-message", handleMessage);
        socket.on("disconnect", handleDisconnect);
      }

      return () => {
        if (socket) {
          socket.off("group-chatbot-message", handleMessage);
          socket.off("disconnect", handleDisconnect);
        }
      };
    }, [username, id])
  );

  const formatTime = (time) => {
    const options = { hour: "numeric", minute: "numeric" };
    return new Date(time).toLocaleString("en-US", options);
  };

  const handleSubmit = (type) => {
    setMessageGoing(true);
    if (socket) {
      if (message.length > 0 && message.trim() !== "") {
        let complete_message = {
          sender: username,
          message: message,
          timeStamp: new Date().getTime(),
          group_id: username + socket.id + id,
          type: type,
          message_id: 0,
          assistant_name: assistant_name,
        };
        setMessages([...messages, complete_message]);
        complete_message.message_id = messages.length;
        socket.emit("group-chatbot-message", complete_message);
        setMessage("");
        scrollToBottom();
      }
    }
    setMessageGoing(false);
  };

  const retryfetch = () => {
    setnetworkLoad(false);
    networkErrorRef.current = false;
    if (fetchData.get("assistant")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`assistant`, false);
        return newMap;
      });
      getAssistantName();
    }

    if (fetchData.get("documents")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`documents`, false);
        return newMap;
      });
      getDocuments();
    }
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topContainer}>
        <TouchableOpacity
          style={{ ...styles.backIcon, zIndex: 111 }}
          onPress={() => {
            handleLeftRoom();
            if (type === "discover") {
              navigation.navigate("Main", { screen: "discover" });
            } else {
              navigation.navigate("GroupMembers", {
                id: id,
                username: username,
              });
            }
          }}
        >
          <Svg viewBox="0 0 24 24" width={24} height={24}>
            <Path d="M0 0h24v24H0z" fill="none" />
            <Path
              fill="white"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      {networkLoad ? (
        <View
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "90%",
          }}
          onPress={() => {
            toggleModal();
          }}
        >
          <Button title="Refresh" onPress={() => retryfetch()}></Button>
        </View>
      ) : loading ? (
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
        <>
          <View style={styles.topContainer}>
            <Text style={styles.heading}>{displayName}</Text>
          </View>

          <View style={styles.top_container_2}>
            <TouchableOpacity
              style={{
                ...styles.card,
                backgroundColor: "#3a513a",
                borderColor: "#00c11f",
              }}
              onPress={() => {
                navigation.navigate("UploadDoc", {
                  assistantId: assistantId,
                  assistantName: assistant_name,
                  group_id: id,
                  username: username,
                  redirect: "chatbot",
                });
              }}
            >
              <Svg viewBox="0 0 24 24" width={24} height={24}>
                <Path d="M0 0h24v24H0z" fill="none" />
                <Path fill="#00c11f" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </Svg>
              <Text style={{ ...styles.boxText, color: "#00c11f" }}>
                Add to your knowledge-base
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                ...styles.card,
                backgroundColor: "#625a1c",
                borderColor: "#fef80e",
              }}
              onPress={toggleModal}
            >
              <Svg viewBox="0 0 24 24" width={24} height={24}>
                <Path d="M0 0h24v24H0V0z" fill="none" />
                <Path
                  fill="#fef80e"
                  d="M19 1l-5 5v11l5-4.5V1zM1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5V6c-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6zm22 13.5V6c-.6-.45-1.25-.75-2-1v13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5v2c1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5v-1.1z"
                />
              </Svg>
              <Text style={{ ...styles.boxText, color: "#fef80e" }}>
                See your knowledge-base
              </Text>
            </TouchableOpacity>
          </View>

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
                {messages.length > 0 &&
                  messages.map((item, index) => {
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
                            <View
                              style={{
                                position: "relative",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {loadingImage.get("profileImage") === true && (
                                <ActivityIndicator
                                  style={{ position: "absolute", zIndex: 1 }}
                                ></ActivityIndicator>
                              )}
                              <Image
                                source={{
                                  uri:
                                    item.sender === username
                                      ? `${profile_pic}`
                                      : "https://assets.api.uizard.io/api/cdn/stream/97f1470f-0823-4ecf-bd7a-946c8b346134.jpg",
                                }}
                                style={styles.senderImage}
                                onLoadStart={() => {
                                  setLoadingImage((prevMap) => {
                                    const newMap = new Map(prevMap);
                                    newMap.set(`profileImage`, true);
                                    return newMap;
                                  });
                                }}
                                onLoadEnd={() => {
                                  setTimeout(() => {
                                    setLoadingImage((prevMap) => {
                                      const newMap = new Map(prevMap);
                                      newMap.set(`profileImage`, false);
                                      return newMap;
                                    });
                                  }, 5);
                                }}
                              />
                            </View>
                            <Text style={styles.senderName}>
                              {item.sender === username ? "You" : displayName}
                            </Text>

                            <Text
                              style={{
                                textAlign: "left",
                                fontSize: 9,
                                color: "gray",
                                marginTop: -15,
                                marginLeft: 10,
                              }}
                            >
                              {formatTime(item.timeStamp)}
                            </Text>
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
                disabled={messageGoing ? true : false}
                style={styles.sendButton}
              >
                <Svg viewBox="0 0 384 512" width={15} height={15}>
                  <Path
                    fill="white"
                    d="M374.6 246.6C368.4 252.9 360.2 256 352 256s-16.38-3.125-22.62-9.375L224 141.3V448c0 17.69-14.33 31.1-31.1 31.1S160 465.7 160 448V141.3L54.63 246.6c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0l160 160C387.1 213.9 387.1 234.1 374.6 246.6z"
                  ></Path>
                </Svg>
              </Pressable>
            </View>

            <Modal
              isVisible={isModalVisible}
              swipeDirection="down"
              onSwipeComplete={toggleModal}
              onBackdropPress={toggleModal}
              style={{ justifyContent: "flex-end", margin: 0, flex: 1 }}
              onRequestClose={toggleModal}
            >
              <View style={styles.bottomSheet}>
                <View style={styles.memberHeaderContainer}>
                  <Text style={styles.memberHeaderText}>Uploaded Docs</Text>
                </View>

                <View style={styles.memberListContainer}>
                  {documentLoading ? (
                    <ActivityIndicator></ActivityIndicator>
                  ) : (
                    <FlatList
                      data={documents}
                      renderItem={renderDocument}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={styles.memberList}
                    />
                  )}
                </View>

              </View>
            </Modal>
          </KeyboardAvoidingView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
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
    fontSize: 30,
    fontFamily: "Red Hat Display",
    fontWeight: "bold",
  },
  topContainer: {
    width: screenWidth * 0.9,
    height: 35,
    justifyContent: "center",
    alignSelf: "center",
  },
  top_container_2: {
    width: screenWidth * 0.9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
  },
  card: {
    width: screenWidth * 0.42,
    height: screenWidth * 0.3,
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
  bottomSheet: {
    backgroundColor: "#1f1e1e",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.8,
  },
  memberHeaderContainer: {
    display: "flex",
    alignItems: "left",
    justifyContent: "center",
    width: "90%",
    height: "10%",
    marginTop: 0,
    marginLeft: 20,
  },
  memberHeaderText: {
    color: "#ffffff",
    fontSize: 25,
    fontFamily: "Red Hat Display",
    fontWeight: "bold",
    lineHeight: 26,
  },
  memberListContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 1,
    height: "80%",
    width: "100%",
  },
  memberList: {
    width: screenWidth * 0.85,
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
  },
  memberInnerLeft: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "25%",
    height: "100%",
  },
  memberInnerCenter: {
    display: "flex",
    alignItems: "left",
    flexDirection: "column",
    justifyContent: "center",
    width: "62%",
    height: "100%",
  },
  memberInnerRight: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "10%",
    height: "100%",
  },
  memberCard: {
    width: screenWidth,
    height: 65,
    backgroundColor: "transparent",
    borderRadius: 8,
    display: "flex",
    flexDirection: "row",
    marginVertical: 0,
    borderRadius: 15,
  },
  memberImage: {
    width: 40,
    height: 40,
    resizeMode: "cover",
  },
  removeIcon: {
    backgroundColor: "white",
    width: 20,
    height: 20,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  memberName: {
    color: "#ffffff",
    fontSize: 17,
    fontFamily: "Red Hat Display",
    fontWeight: "350",
    marginBottom: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  sendButton: {
    width: 30,
    height: 30,
    backgroundColor: "#0451f8",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  ResetButton: {
    backgroundColor: "white",
    width: screenWidth * 0.8,
    height: 40,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  ResetText: {
    color: "black",
    fontSize: 15,
    fontFamily: "Raleway",
    fontWeight: "350",
  },
});

export default GroupChatbotScreen;
