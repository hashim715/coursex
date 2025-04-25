import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Button,
  Alert,
} from "react-native";
import { Svg, Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { LogBox } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import * as DocumentPicker from "expo-document-picker";
import RNPickerSelect from "react-native-picker-select";
import AsyncStorage from "@react-native-async-storage/async-storage";

import YoutubeIcon from "./bottomIcons/youtubeIcon";
import SummaryIcon from "./bottomIcons/summaryIcon";
import DocumentIcon from "./bottomIcons/documentIcon";
import WebIcon from "./bottomIcons/webIcon";
import CourseIcon from "./bottomIcons/courseIcon";
import RemoveIcon from "./bottomIcons/removeIcon";
import { uploadDocumentsToS3ForKnowledgeBase } from "../components/uploadFunctions";
import { useSelector } from "react-redux";
import useAxios from "../utils/useAxios";
import NetInfo from "@react-native-community/netinfo";

LogBox.ignoreAllLogs(true);

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const DiscoverScreen = () => {
  const navigation = useNavigation();
  const [username, setUserName] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModal2Visible, setIsModal2Visible] = useState(false);
  const [isModal3Visible, setIsModal3Visible] = useState(false);
  const [isModal4Visible, setIsModal4Visible] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [webPageUrl, setWebPageUrl] = useState("");
  const [course, setCourse] = useState("");
  const [document, setDocument] = useState("");
  const [groups, setGroups] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [documentUpLoading, setDocumentUpLoading] = useState(false);
  const api = useAxios();
  const baseURL = useSelector((state) => state.baseUrl.url);
  const networkErrorRef = useRef(false);
  const [networkLoad, setnetworkLoad] = useState(false);
  const [grouploading, setGroupLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fetchData, setfetchData] = useState(new Map());
  const [refreshDocuments, setRefreshDocuments] = useState(false);
  const [selectDocument, setSelectDocument] = useState(false);

  const getUserName = async () => {
    try {
      let username = await AsyncStorage.getItem("username");
      if (username !== null) {
        username = JSON.parse(username);
        setUserName(username);
      }
    } catch (e) {
      navigation.navigate("Main", { screen: "chats" });
    }
  };

  useEffect(() => {
    getUserName();
  }, []);

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

  const getGroupsByUser = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError("group");
        return;
      }
      setGroupLoading(true);
      const response = await api.get(`${baseURL}/api/user/getGroupsByUser`);
      const groups_ = [];
      for (const group of response.data.message) {
        groups_.push({ label: group.name, value: group.id });
      }
      setGroups(groups_);
      setGroupLoading(false);
    } catch (err) {
      setGroupLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("group");
      } else {
        handleNetworkError("group");
      }
    }
  }, []);

  const getDocuments = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        handleNetworkError("documents");
        return;
      }
      setDocumentLoading(true);
      const response = await api.get(`${baseURL}/api/ai/getDocuments`);
      const documents_ = [];
      for (const document of response.data.message) {
        documents_.push({ label: document.name, value: document.document_url });
      }
      setDocuments(documents_);
      setDocumentLoading(false);
    } catch (err) {
      setDocumentLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("documents");
      } else {
        handleNetworkError("documents");
      }
    }
  }, []);

  useEffect(() => {
    getGroupsByUser();
  }, []);

  useEffect(() => {
    getDocuments();
  }, [refreshDocuments]);

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
    });

    setDocumentUpLoading(true);
    if (result.canceled === false) {
      if (result.assets && result.assets.length > 0) {
        setFileName(result.assets[0].name);
        const document_url = await uploadDocumentsToS3ForKnowledgeBase(
          result.assets[0]
        );
        setFile(document_url);
        await addDocument(result.assets[0].name, document_url);
        // setRefreshDocuments(true);
      } else {
        setFileName(result.name);
        const document_url = await uploadDocumentsToS3ForKnowledgeBase(result);
        setFile(document_url);
        await addDocument(result.name, document_url);
        // setRefreshDocuments(true);
      }
    } else {
      Alert.alert("No file selected");
    }
    setDocumentUpLoading(false);
  };

  const addDocument = async (name, document_url) => {
    try {
      const state = await NetInfo.fetch();

      if (!state.isConnected) {
        Alert.alert(
          "There might be an issue with your internet connection try again..."
        );
        return;
      }

      const response = await api.post(`${baseURL}/api/ai/createDocument/`, {
        name: name,
        document_url: document_url,
      });

      Alert.alert("Document created successfully");
    } catch (err) {
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  const handleSummarizePress = () => {
    setIsModalVisible(true);
  };

  const handleDocumentPress = () => {
    setIsModal2Visible(true);
  };

  const handleCoursePress = () => {
    setIsModal3Visible(true);
  };

  const handleWebPagePress = () => {
    setIsModal4Visible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setYoutubeUrl("");
    navigation.navigate("ChatbotScreen", {
      option: "Summarizing a YouTube video",
      youtubeUrl: youtubeUrl,
    });
  };

  const handleCloseModal2 = () => {
    setIsModal2Visible(false);
    navigation.navigate("ChatbotScreen", {
      option: "Learning from a document",
      document_url: selectDocument ? document : file,
    });
    selectDocument ? console.log("Document") : console.log("File"); 
    setFile(null);
    setFileName("");
    setSelectDocument(false);
    setDocument("");
    setRefreshDocuments(true);
  };

  const handleCloseModal3 = () => {
    setIsModal3Visible(false);
    if (!course || course.length > 1) {
      Alert.alert("Please select a valid course");
    } else {
      navigation.navigate("GroupChatbotScreen", {
        id: course,
        username: username,
        type: "discover",
      });
      setCourse("");
    }
  };

  const handleCloseModal4 = () => {
    setIsModal4Visible(false);
    setWebPageUrl("");
    navigation.navigate("ChatbotScreen", {
      option: "Getting a web page summary",
      webPageUrl: webPageUrl,
    });
  };

  const retryfetch = () => {
    setnetworkLoad(false);
    networkErrorRef.current = false;
    if (fetchData.get("group")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set("group", false);
        return newMap;
      });
      getGroupsByUser();
    }

    if (fetchData.get("documents")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set("documents", false);
        return newMap;
      });
      getDocuments();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {networkLoad ? (
        <>
          <View
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              title="Refresh"
              onPress={() => {
                retryfetch();
              }}
            ></Button>
          </View>
        </>
      ) : grouploading || documentLoading ? (
        <>
          <View
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator></ActivityIndicator>
          </View>
        </>
      ) : (
        <>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting_1}>Hello {username},</Text>
            <Text style={styles.greeting_2}>How may I help you today?</Text>
          </View>

          <TouchableOpacity
            style={styles.optionContainer}
            onPress={() => {
              navigation.navigate("ChatbotScreen", {
                option: "Searching the web",
              });
            }}
          >
            <View style={styles.OptionIconContainer}>
              <WebIcon />
            </View>
            <View style={styles.optionRightContainer}>
              <Text style={styles.OptionText}>Search the web</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleCoursePress}
          >
            <View style={styles.OptionIconContainer}>
              <CourseIcon />
            </View>
            <View style={styles.optionRightContainer}>
              <Text style={styles.OptionText}>Ask about a college course</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleDocumentPress}
          >
            <View style={styles.OptionIconContainer}>
              <DocumentIcon />
            </View>
            <View style={styles.optionRightContainer}>
              <Text style={styles.OptionText}>Learn from a document</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleSummarizePress}
          >
            <View style={styles.OptionIconContainer}>
              <YoutubeIcon />
            </View>
            <View style={styles.optionRightContainer}>
              <Text style={styles.OptionText}>Summarize a YouTube video</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionContainer}
            onPress={handleWebPagePress}
          >
            <View style={styles.OptionIconContainer}>
              <SummaryIcon />
            </View>
            <View style={styles.optionRightContainer}>
              <Text style={styles.OptionText}>Get a web page summary</Text>
            </View>
          </TouchableOpacity>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={handleCloseModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => {
                    setIsModalVisible(false);
                  }}
                >
                  <RemoveIcon />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Enter YouTube Video URL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YouTube Video URL"
                  placeholderTextColor="#aaa"
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    handleCloseModal();
                  }}
                >
                  <Text style={styles.modalButtonText}>Summarize</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isModal2Visible}
            onRequestClose={handleCloseModal2}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => {
                    setIsModal2Visible(false);
                  }}
                >
                  <RemoveIcon />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Upload your document</Text>
                <View style={styles.Card}>
                  <TouchableOpacity
                    onPress={() => {
                      pickDocument();
                    }}
                    style={styles.uploadButton}
                    disabled={documentUpLoading ? true : false}
                  >
                    <Svg
                      viewBox="0 0 24 24"
                      width={48}
                      height={48}
                      fill={"black"}
                    >
                      <Path d="M0 0h24v24H0V0z" fill="none" />
                      <Path
                        fill="#c2c2c2"
                        d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11z"
                      />
                    </Svg>
                    {fileName ? (
                      <Text style={styles.fileName}>{fileName}</Text>
                    ) : (
                      <Text style={styles.fileName}>Upload</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>Or choose a document</Text>

                <View style={styles.dropdown}>
                  <View style={styles.selectionField}>
                    <RNPickerSelect
                      onValueChange={(value) => {
                        setDocument(value);
                        setSelectDocument(true);
                      }}
                      items={documents}
                      placeholder={{
                        label: "Select a document",
                        value: null,
                        color: "gray",
                      }}
                      value={document}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => {
                        return (
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              display: "flex",
                              marginTop: 7.5,
                            }}
                          >
                            <Svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <Path
                                d="M7 10l5 5 5-5"
                                stroke="gray"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </View>
                        );
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleCloseModal2()}
                  disabled={documentUpLoading ? true : false}
                >
                  {documentUpLoading ? (
                    <ActivityIndicator></ActivityIndicator>
                  ) : (
                    <Text style={styles.modalButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isModal3Visible}
            onRequestClose={handleCloseModal3}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => {
                    setIsModal3Visible(false);
                  }}
                >
                  <RemoveIcon />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Choose a course</Text>
                <View style={styles.dropdown}>
                  <View style={styles.selectionField}>
                    <RNPickerSelect
                      onValueChange={(value) => setCourse(value)}
                      items={groups}
                      placeholder={{
                        label: "Select a course",
                        value: null,
                        color: "gray",
                      }}
                      value={course}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => {
                        return (
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              display: "flex",
                              marginTop: 7.5,
                            }}
                          >
                            <Svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <Path
                                d="M7 10l5 5 5-5"
                                stroke="gray"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </View>
                        );
                      }}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleCloseModal3()}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isModal4Visible}
            onRequestClose={handleCloseModal4}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.removeIcon}
                  onPress={() => {
                    setIsModal4Visible(false);
                  }}
                >
                  <RemoveIcon />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Paste your link here</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Web Page URL"
                  placeholderTextColor="#aaa"
                  value={webPageUrl}
                  onChangeText={setWebPageUrl}
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    handleCloseModal4();
                  }}
                >
                  <Text style={styles.modalButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingContainer: {
    flexDirection: "column",
    justifyContent: "flex-start",
    width: screenWidth * 0.95,
    marginLeft: screenWidth * 0.05,
    marginBottom: 20,
  },
  greeting_1: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "500",
    lineHeight: 31,
    marginBottom: 10,
  },
  greeting_2: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 21,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "left",
    width: screenWidth * 0.7,
    height: 50,
    marginLeft: screenWidth * 0.05,
    marginBottom: 20,
    backgroundColor: "#151515",
    borderRadius: 100,
  },
  OptionIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "20%",
  },
  optionRightContainer: {
    justifyContent: "center",
    width: "90%",
  },
  OptionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: screenWidth * 0.8,
    backgroundColor: "#151515",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "white",
  },
  input: {
    width: "100%",
    borderColor: "#505050",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    marginTop: 10,
    color: "white",
    backgroundColor: "#2b2b2b",
  },
  modalButton: {
    width: "70%",
    padding: 5,
    backgroundColor: "white",
    borderRadius: 100,
    marginTop: 5,
  },
  modalButtonText: {
    color: "black",
    fontSize: 16,
    textAlign: "center",
  },
  Card: {
    width: "90%",
    height: 70,
    backgroundColor: "#151515",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
    marginTop: 20,
  },
  uploadButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  fileName: {
    color: "#c2c2c2",
    fontSize: 14,
    fontFamily: "Montserrat",
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 10,
    borderColor: "#505050",
    paddingHorizontal: 10,
    width: "100%",
    height: 40,
    color: "white",
    backgroundColor: "#1f1e1e",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,

    marginBottom: 13,
  },
  selectionField: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  removeIcon: {
    position: "absolute",
    top: -5, // Moves the icon up so that half is outside
    right: -5, // Moves the icon to the right, so it's half outside the corner
    backgroundColor: "#d70900",
    zIndex: 1,
    width: 20, // Size of the icon
    height: 20, // Size of the icon
    borderRadius: 15, // Ensures the icon is circular
    justifyContent: "center",
    alignItems: "center",
  },
});

const pickerSelectStyles = {
  inputIOS: {
    color: "white",
    paddingVertical: 12,
  },
  inputAndroid: {
    color: "white",
    paddingVertical: 12,
  },
  placeholder: {
    color: "gray",
  },
};

export default DiscoverScreen;
