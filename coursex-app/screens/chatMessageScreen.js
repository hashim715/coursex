import {
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  Pressable,
  Image,
  SafeAreaView,
  Platform,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Alert,
  BackHandler,
  ActivityIndicator,
  Button,
} from "react-native";
import { Video } from "expo-av";
import Svg, { parse, Path } from "react-native-svg";
import React, { useState, useEffect, useRef } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import useAxios from "../utils/useAxios";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useSelector, useDispatch } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as VideoThumbnails from "expo-video-thumbnails";
import Modal from "react-native-modal";
import { Linking } from "react-native";
import { styles } from "../components/styleSheets";
import {
  handleDocumentSubmit,
  handleImagesSubmit,
  handleVideoSubmit,
  handleTextSubmit,
} from "../components/mediaSubmitFunctions";
import {
  pickDocument,
  pickVideos,
  pickImage,
} from "../components/pickMediaFunctions";
import { groupImageMessages } from "../components/groupImageMessages";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import { database } from "../components/database/createdb";
import { Q } from "@nozbe/watermelondb";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const ChatMessagesScreen = ({ route }) => {
  const { id, username } = route.params;
  const [messages, setMessages] = useState([]);
  const navigation = useNavigation();
  const [groupname, setGroupname] = useState("");
  const [imageSaving, setImageSaving] = useState(false);
  const [videoSaving, setVideoSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isModalTwoVisible, setIsModalTwoVisible] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const lineHeight = 20;
  const maxLines = 3;
  const maxHeight = lineHeight * maxLines;
  const api = useAxios();
  const baseURL = useSelector((state) => state.baseUrl.url);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const socket = useSelector((state) => state.socket.instance);
  const refreshMessageScreen = useSelector(
    (state) => state.handleUseffect.refreshMessageScreen
  );
  const refreshDetailScreen = useSelector(
    (state) => state.handleUseffect.refreshDetailScreen
  );
  const [theimageurl, settheImageUrl] = useState("");
  const [numMembers, setNumMembers] = useState(0);
  const [groupmembers, setGroupMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageLoading, setMessageLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);
  const [messageGoing, setMessageGoing] = useState(false);
  const [loadingImage, setLoadingImage] = useState(new Map());
  const [loadingVideo, setLoadingVideo] = useState(new Map());
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [networkLoad, setnetworkLoad] = useState(false);
  const [fetchData, setfetchData] = useState(new Map());
  const [retryUploadingMap, setRetryUploadingMap] = useState(new Map());
  const networkErrorRef = useRef(false);
  const videoRef = useRef(null);
  const modalVideoRef = useRef(null);
  const intervalRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [groupType, setgroupType] = useState("");
  const dispatch = useDispatch();

  const updateRetryUploadingStateMap = useCallback(async () => {
    const retryUploadingStateMap = await AsyncStorage.getItem(
      "retryUploadingMap"
    );

    if (retryUploadingStateMap) {
      const parsedObject = JSON.parse(retryUploadingStateMap);
      setRetryUploadingMap(new Map(parsedObject));
    }
  }, [id, setRetryUploadingMap]);

  useEffect(() => {
    updateRetryUploadingStateMap();
  }, [id]);

  const setUploadingState = useCallback(async () => {
    let image_uploading = await AsyncStorage.getItem(`image-uploading`);
    let document_uploading = await AsyncStorage.getItem("document-uploading");
    let video_uploading = await AsyncStorage.getItem("video-uploading");

    image_uploading = image_uploading ? JSON.parse(image_uploading) : false;
    document_uploading = document_uploading
      ? JSON.parse(document_uploading)
      : false;
    video_uploading = video_uploading ? JSON.parse(video_uploading) : false;

    setDocumentUploading(document_uploading);
    setVideoUploading(video_uploading);
    setImageUploading(image_uploading);

    if (!image_uploading && !document_uploading && !video_uploading) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startUploadingStateChecker = useCallback(() => {
    if (intervalRef.current) {
      return;
    }

    setUploadingState();
    intervalRef.current = setInterval(() => {
      setUploadingState();
    }, 1000);
  }, [setUploadingState]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    startUploadingStateChecker();
  }, [id]);

  const handleContentSizeChangeText = (e) => {
    const newHeight = e.nativeEvent.contentSize.height;
    setInputHeight(Math.min(maxHeight, newHeight));
  };

  const handleVideoPress = async () => {
    if (isModalVisible && selectedVideo) {
      if (isPlaying) {
        await modalVideoRef.current.pauseAsync();
      } else {
        await modalVideoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleOpenPDF = (pdfUrl) => {
    Linking.openURL(pdfUrl).catch((err) =>
      console.error("Failed to open PDF", err)
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

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

  const updatedMessageStatusToRead = useCallback(async () => {
    try {
      const response = await api.get(
        `${baseURL}/api/chats/updateMessageStatus/${id}`
      );
    } catch (err) {
      console.log(err);
    }
  }, [id]);

  const getGroupDetails = useCallback(async () => {
    try {
      setLoading(true);

      let usergroup = await database
        .get("groups")
        .query(Q.where("group_id", id))
        .fetch();

      // console.log(usergroup);

      if (usergroup.length > 0) {
        usergroup = usergroup[0]["_raw"];
        const group_members = JSON.parse(usergroup.group_members);
        setGroupname(usergroup.name);
        setNumMembers(group_members.length);
        settheImageUrl(
          usergroup.type === "course" ? usergroup.theme : usergroup.image
        );
        setgroupType(usergroup.type);
        setGroupMembers(group_members);
        // } else {
        //   console.log("i am here");
        //   const state = await NetInfo.fetch();

        //   if (!state.isConnected) {
        //     handleNetworkError("details");
        //     return;
        //   }

        //   const response = await api.get(
        //     `${baseURL}/api/user/getGroupDetails/${id}`
        //   );

        //   setGroupname(response.data.group.name);
        //   setNumMembers(response.data.members.users.length);
        //   settheImageUrl(
        //     response.data.group.type === "course"
        //       ? response.data.group.theme
        //       : response.data.group.image
        //   );
        //   setgroupType(response.data.group.type);
        //   setGroupMembers(response.data.members.users);

        //   const { admins, createdAt, updatedAt, college, name, description, image, theme, type } = response.data.group;

        //   const { users } = response.data.members;

        //   // console.log(users);

        //   await database.write(async () => {
        //     await database.get("group_details").create((group) => {
        //       Object.assign(group._raw, {
        //         name: name,
        //         description: description,
        //         image: image,
        //         theme: theme,
        //         type: type,
        //         college: college,
        //         admins : JSON.stringify(admins),
        //         group_id: id,
        //         group_members : JSON.stringify(users)
        //       });
        //     });
        //   });
        // }
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("details");
      } else {
        handleNetworkError("details");
      }
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const handleMessage = async (msg) => {
        if (msg.id !== socket.id) {
          if (parseInt(msg.group_id) === id) {
            setMessages((prevMessages) => [...prevMessages, msg]);
            // await updatedMessageStatusToRead();
          }
        }
      };

      const handleDisconnect = () => {
        console.log("disconnecting from room.......");
      };

      if (socket) {
        socket.on("message", handleMessage);
        socket.on("disconnect", handleDisconnect);
      }

      return () => {
        if (socket) {
          socket.off("message", handleMessage);
          socket.off("disconnect", handleDisconnect);
        }
      };
    }, [username, id])
  );

  const getUserMessages = useCallback(async () => {
    try {
      setMessageLoading(true);

      let messages_stored = await database
        .get("messages")
        .query(Q.where("group_id", id), Q.sortBy("time_stamp", "desc"))
        .fetch();

      messages_stored = messages_stored.reverse();

      let image_uploading = await AsyncStorage.getItem(`image-uploading`);
      let document_uploading = await AsyncStorage.getItem("document-uploading");
      let video_uploading = await AsyncStorage.getItem("video-uploading");
      image_uploading = image_uploading ? JSON.parse(image_uploading) : false;
      document_uploading = document_uploading
        ? JSON.parse(document_uploading)
        : false;
      video_uploading = video_uploading ? JSON.parse(video_uploading) : false;

      if (messages_stored.length > 0) {
        console.log("i am there boy hh");
        messages_stored = messages_stored.slice(-200);
        const sanitized_docs = messages_stored.map((message) => {
          const {
            status,
            image_data,
            video_data,
            time_stamp,
            document_data,
            ...rest
          } = message["_raw"];
          return {
            ...rest,
            status: JSON.parse(status),
            video_data: JSON.parse(video_data),
            document_data: JSON.parse(document_data),
            image_data: JSON.parse(image_data),
            timeStamp: time_stamp,
          };
        });

        messages_stored = groupImageMessages(sanitized_docs);

        setMessages(messages_stored);
      } else {
        const state = await NetInfo.fetch();

        if (!state.isConnected) {
          handleNetworkError("messages");
          return;
        }

        const response = await api.get(
          `${baseURL}/api/chats/getMessagesByGroup/${id}`
        );

        const sanitized_docs = response.data.message.map((message) => {
          const { __v, timeStamp, _id, status, groupId, ...rest } = message;
          return {
            ...rest,
            group_id: groupId,
            _id: _id,
            timeStamp: timeStamp,
            status: status,
            version: __v,
          };
        });

        const messages_grouped = groupImageMessages(sanitized_docs);

        setMessages(messages_grouped);

        const sanitized_docs_ = response.data.message.map((message) => {
          const { __v, timeStamp, _id, status, groupId, ...rest } = message;
          return {
            ...rest,
            group_id: groupId,
            _id: _id,
            time_stamp: timeStamp,
            status: JSON.stringify(status),
            version: __v,
          };
        });

        await database.write(async () => {
          await database.batch(
            ...sanitized_docs_.map((message) =>
              database.get("messages").prepareCreate((record) => {
                Object.assign(record._raw, message);
              })
            )
          );
        });
      }
      setMessageLoading(false);
    } catch (err) {
      console.log(err);
      setMessageLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("messages");
      } else {
        handleNetworkError("messages");
      }
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      getUserMessages();
    }
  }, [id]);

  const syncUserMessagesForASingleGroup = useCallback(async () => {
    try {
      const response = await api.get(
        `${baseURL}/api/chats/syncMessagesForSingleGroup/${id}`
      );

      const sanitized_docs = response.data.message.map((message) => {
        const { __v, groupId, _id, timeStamp, status, ...rest } = message;

        const sanitizedMessage = {
          ...rest,
          group_id: groupId,
          _id: _id,
          time_stamp: timeStamp,
          version: __v.toString(),
          status: JSON.stringify(status),
        };

        return sanitizedMessage;
      });

      if (sanitized_docs.length === 0) {
        return;
      }

      const existingMessages = await database
        .get("messages")
        .query(
          Q.where("group_id", id),
          Q.sortBy("time_stamp", "desc"),
          Q.take(sanitized_docs.length)
        )
        .fetch();

      console.log("excisting messages", existingMessages);

      const existingMessageSet = new Set(
        existingMessages.map(
          (message) =>
            `${message["_raw"].group_id}-${message["_raw"].time_stamp}`
        )
      );

      console.log("existing", existingMessageSet);

      const newMessages = sanitized_docs.filter((message) => {
        const messageKey = `${message.group_id}-${message.time_stamp}`;
        return !existingMessageSet.has(messageKey);
      });

      console.log("new", newMessages);

      if (newMessages.length > 0) {
        let messages_grouped = newMessages
          .map((message) => {
            const { time_stamp, status, ...rest } = message;
            return {
              ...rest,
              status: JSON.parse(status),
              timeStamp: time_stamp,
            };
          })
          .reverse();
        messages_grouped = groupImageMessages(messages_grouped);
        setMessages((prevMessages) => {
          const new_messages = [...prevMessages, ...messages_grouped];
          return new_messages;
        });
        await database.write(async () => {
          await database.batch(
            ...newMessages.map((message) =>
              database.get("messages").prepareCreate((record) => {
                Object.assign(record._raw, message);
              })
            )
          );
        });
      }
    } catch (err) {
      console.log(err);
    }
  }, [id]);

  useEffect(() => {
    syncUserMessagesForASingleGroup();
  }, [id]);

  useEffect(() => {
    if (id || refreshDetailScreen) {
      getGroupDetails();
      dispatch(handleUseffectActions.setRefreshDetailScreen({ reload: false }));
    }
  }, [id, refreshDetailScreen]);

  const retryfetch = () => {
    setnetworkLoad(false);
    networkErrorRef.current = false;
    if (fetchData.get("details")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`details`, false);
        return newMap;
      });
      getGroupDetails();
    }

    if (fetchData.get("messages")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set(`messages`, false);
        return newMap;
      });
      getUserMessages();
    }
  };

  const openImageModal = (imageUrl, type) => {
    if (type === "video") {
      setSelectedVideo(imageUrl);
      setIsModalVisible(true);
      return;
    }
    setSelectedImage(imageUrl);
    setIsModalVisible(true);
  };

  const closeImageModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
    setSelectedVideo(null);
    if (isPlaying) {
      handleVideoPress();
    }
  };

  const ToggleModalTwo = () => {
    setIsModalTwoVisible(!isModalTwoVisible);
  };

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

  const formatTime = (time) => {
    const options = { hour: "numeric", minute: "numeric" };
    return new Date(time).toLocaleString("en-US", options);
  };

  const saveMediaToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }

      const mediaUri = selectedImage;
      if (!mediaUri || typeof mediaUri !== "string") {
        Alert.alert("No valid media found to save!");
        return;
      }

      const isLocalFile = mediaUri.startsWith("file://");
      if (isLocalFile) {
        Alert.alert("Your image is being uploaded please wait.");
        return;
      }

      setImageSaving(true);

      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
      const formattedTime = `${String(currentDate.getHours()).padStart(
        2,
        "0"
      )}-${String(currentDate.getMinutes()).padStart(2, "0")}-${String(
        currentDate.getSeconds()
      ).padStart(2, "0")}`;
      const safeFileName = `coursex_${formattedDate}_${formattedTime}.png`;
      const localUri = FileSystem.documentDirectory + safeFileName;

      const { uri: downloadedUri } = await FileSystem.downloadAsync(
        mediaUri,
        localUri
      );

      const fileInfo = await FileSystem.getInfoAsync(downloadedUri);
      if (!fileInfo.exists) {
        Alert.alert("Downloaded file does not exist.");
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(downloadedUri);

      setImageSaving(false);
      Alert.alert("Media saved to gallery!");
      closeImageModal();
    } catch (error) {
      setImageSaving(false);
      Alert.alert("Failed to save the media.");
      console.error("Error saving media:", error);
    }
  };

  const saveVideoToGallery = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }

      const mediaUri = selectedVideo;
      if (!mediaUri || typeof mediaUri !== "string") {
        Alert.alert("No valid media found to save!");
        return;
      }

      const isLocalFile = mediaUri.startsWith("file://");
      if (isLocalFile) {
        Alert.alert("Your video is being uploaded please wait.");
        return;
      }

      setVideoSaving(true);

      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
      const formattedTime = `${String(currentDate.getHours()).padStart(
        2,
        "0"
      )}-${String(currentDate.getMinutes()).padStart(2, "0")}-${String(
        currentDate.getSeconds()
      ).padStart(2, "0")}`;
      const safeFileName = `coursex_${formattedDate}_${formattedTime}.png`;
      const localUri = FileSystem.documentDirectory + safeFileName;

      const { uri: downloadedUri } = await FileSystem.downloadAsync(
        mediaUri,
        localUri
      );

      const fileInfo = await FileSystem.getInfoAsync(downloadedUri);
      if (!fileInfo.exists) {
        Alert.alert("Downloaded file does not exist.");
      }

      const asset = await MediaLibrary.createAssetAsync(downloadedUri);

      setVideoSaving(false);
      Alert.alert("Media saved to gallery!");
      closeImageModal();
    } catch (error) {
      setVideoSaving(false);
      Alert.alert("Failed to save the media.");
      console.error("Error saving media:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {loading ? (
          <View style={styles.ImageContainer}>
            <ActivityIndicator></ActivityIndicator>
          </View>
        ) : (
          <View style={styles.ImageContainer}>
            <ImageBackground
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/A_black_image.jpg/640px-A_black_image.jpg",
              }}
              style={styles.Image}
            >
              <View style={styles.overlay} />
              <View
                style={{
                  position: "relative",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {loadingImage.get(`groupDetails-image`) && (
                  <ActivityIndicator
                    style={{ position: "absolute", zIndex: 1 }}
                  />
                )}

                <Image
                  source={{ uri: theimageurl }}
                  style={{
                    width: 30,
                    height: 30,
                    display: "flex",
                    marginLeft: screenWidth * 0.11,
                    marginBottom: 3,
                    borderRadius: 5,
                  }}
                  onLoadStart={() => {
                    // setLoadingImage((prevMap) => {
                    //   const newMap = new Map(prevMap);
                    //   newMap.set(`groupDetails-image`, true);
                    //   return newMap;
                    // });
                  }}
                  onLoadEnd={() => {
                    // setTimeout(() => {
                    //   setLoadingImage((prevMap) => {
                    //     const newMap = new Map(prevMap);
                    //     newMap.set(`groupDetails-image`, false);
                    //     return newMap;
                    //   });
                    // }, 5);
                  }}
                />
              </View>

              <View style={styles.headingBox}>
                <Text style={styles.companyName}>{groupname}</Text>
                <View
                  style={{
                    display: "flex",
                    width: 57,
                    height: 27,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginHorizontal: 10,
                    backgroundColor: "#232222",
                    paddingHorizontal: 10,
                    borderRadius: 100,
                    marginTop: -5,
                  }}
                >
                  <Svg viewBox="0 0 24 24" width={20} height={20}>
                    <Path d="M0 0h24v24H0z" fill="none"></Path>
                    <Path
                      fill="#c2c2c2"
                      d="M16.5 13c-1.2 0-3.07.34-4.5 1-1.43-.67-3.3-1-4.5-1C5.33 13 1 14.08 1 16.25V19h22v-2.75c0-2.17-4.33-3.25-6.5-3.25zm-4 4.5h-10v-1.25c0-.54 2.56-1.75 5-1.75s5 1.21 5 1.75v1.25zm9 0H14v-1.25c0-.46-.2-.86-.52-1.22.88-.3 1.96-.53 3.02-.53 2.44 0 5 1.21 5 1.75v1.25zM7.5 12c1.93 0 3.5-1.57 3.5-3.5S9.43 5 7.5 5 4 6.57 4 8.5 5.57 12 7.5 12zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm9 5.5c1.93 0 3.5-1.57 3.5-3.5S18.43 5 16.5 5 13 6.57 13 8.5s1.57 3.5 3.5 3.5zm0-5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"
                    ></Path>
                  </Svg>
                  <Text style={styles.membersText}>{numMembers}</Text>
                </View>
              </View>
            </ImageBackground>
          </View>
        )}

        <TouchableOpacity
          style={styles.backIconBox}
          onPress={() => {
            navigation.navigate("Main", { screen: "chats" });
          }}
        >
          <Svg width={20} height={20} viewBox="0 0 320 512">
            <Path
              fill="white"
              d="M224 480c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l169.4 169.4c12.5 12.5 12.5 32.75 0 45.25C240.4 476.9 232.2 480 224 480z"
            />
          </Svg>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailIcon}
          onPress={() => {
            navigation.navigate("GroupMembers", {
              id: id,
              username: username,
            });
          }}
        >
          <Svg style={styles.Icon} viewBox="0 0 24 24" width={30} height={30}>
            <Path d="M0 0h24v24H0z" fill="none" />
            <Path
              fill="white"
              d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
            />
          </Svg>
        </TouchableOpacity>

        {networkLoad ? (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: "black",
              justifyContent: "flex-end",
              width: "95%",
              marginLeft: "2.5%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onContentSizeChange={handleContentSizeChange}
            keyboardDismissMode="on-drag"
          >
            <Button
              title="Refresh"
              onPress={() => {
                retryfetch();
              }}
            ></Button>
          </ScrollView>
        ) : messageLoading ? (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: "black",
              justifyContent: "flex-end",
              width: "95%",
              marginLeft: "2.5%",
            }}
            onContentSizeChange={handleContentSizeChange}
            keyboardDismissMode="on-drag"
          >
            <ActivityIndicator
              style={{ paddingBottom: 20 }}
            ></ActivityIndicator>
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              flexGrow: 1,
              backgroundColor: "black",
              justifyContent: "flex-end",
              width: "95%",
              marginLeft: "2.5%",
            }}
            onContentSizeChange={handleContentSizeChange}
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
                      <View
                        style={{
                          position: "relative",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {loadingImage.get(`messageProfiles-${index}`) ===
                          true && (
                          <ActivityIndicator
                            style={{
                              position: "absolute",
                              zIndex: 1,
                            }}
                          />
                        )}

                        <Image
                          source={{
                            uri: groupmembers.find(
                              (member) => member.username === item.sender
                            )?.image,
                          }}
                          style={styles.senderImage}
                          onLoadStart={() => {
                            // setLoadingImage((prevMap) => {
                            //   const newMap = new Map(prevMap);
                            //   newMap.set(`messageProfiles-${index}`, true);
                            //   return newMap;
                            // });
                          }}
                          onLoadEnd={() => {
                            // setTimeout(() => {
                            //   setLoadingImage((prevMap) => {
                            //     const newMap = new Map(prevMap);
                            //     newMap.set(`messageProfiles-${index}`, false);
                            //     return newMap;
                            //   });
                            // }, 5);
                          }}
                        />
                      </View>

                      <Text
                        style={[
                          styles.senderName,
                          {
                            color:
                              item.sender === username ? "#c8edfd" : "yellow",
                          },
                        ]}
                      >
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
              } else if (item.type === "document") {
                return (
                  <Pressable
                    key={index}
                    style={[
                      item.sender === username
                        ? {
                            alignSelf: "flex-end",
                            backgroundColor: "black",
                            padding: 8,
                            borderRadius: 7,
                          }
                        : {
                            alignSelf: "flex-start",
                            backgroundColor: "black",
                            padding: 8,
                            borderRadius: 7,
                          },
                    ]}
                  >
                    {item.error === true ? (
                      <View>
                        <View style={styles.senderDetails}>
                          <View
                            style={{
                              position: "relative",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {loadingImage.get(`messageProfiles-${index}`) ===
                              true && (
                              <ActivityIndicator
                                style={{
                                  position: "absolute",
                                  zIndex: 1,
                                }}
                              />
                            )}

                            <Image
                              source={{
                                uri: groupmembers.find(
                                  (member) => member.username === item.sender
                                )?.image,
                              }}
                              style={styles.senderImage}
                              onLoadStart={() => {
                                // setLoadingImage((prevMap) => {
                                //   const newMap = new Map(prevMap);
                                //   newMap.set(`messageProfiles-${index}`, true);
                                //   return newMap;
                                // });
                              }}
                              onLoadEnd={() => {
                                // setTimeout(() => {
                                //   setLoadingImage((prevMap) => {
                                //     const newMap = new Map(prevMap);
                                //     newMap.set(`messageProfiles-${index}`, false);
                                //     return newMap;
                                //   });
                                // }, 5);
                              }}
                            />
                          </View>

                          <Text
                            style={[
                              styles.senderName,
                              {
                                color:
                                  item.sender === username
                                    ? "#c8edfd"
                                    : "yellow",
                              },
                            ]}
                          >
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
                          >
                            {formatTime(item.timeStamp)}
                          </Text>
                        </View>

                        <View
                          style={{
                            ...styles.mediaGrid,
                            marginLeft: 45,
                            marginTop: -22,
                            alignItems: "center",
                            flexDirection: "row",
                            borderWidth: 1,
                            backgroundColor: "#151515",
                            borderRadius: 10,
                            padding: 10,
                            marginTop: -15,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => {
                              handleDocumentSubmit(
                                item.document_data,
                                item.message,
                                id,
                                setMessages,
                                setRetryUploadingMap,
                                socket,
                                username,
                                new Date(item.timeStamp),
                                true,
                                index,
                                item._id,
                                updateRetryUploadingStateMap
                              );
                            }}
                            key={index}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{
                                position: "relative",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  position: "absolute",
                                  zIndex: 1,
                                }}
                              >
                                {retryUploadingMap.get(
                                  `retryUploading-${index}`
                                ) ? (
                                  <ActivityIndicator
                                    color={"green"}
                                    size={"large"}
                                  ></ActivityIndicator>
                                ) : (
                                  <Text
                                    style={{
                                      color: "red",
                                      fontSize: 20,
                                      marginBottom: 50,
                                    }}
                                  >
                                    {"Retry"}
                                  </Text>
                                )}
                              </View>

                              <Image
                                source={{
                                  uri: item.cover_image,
                                }}
                                style={{
                                  width: 30,
                                  height: 30,
                                  marginRight: 10,
                                }}
                              />

                              <Text
                                style={{
                                  color: "white",
                                  fontSize: 15,
                                  fontFamily: "Red Hat Display",
                                }}
                              >
                                {item.message.length > 10
                                  ? `${item.message.substring(0, 10)}...pdf`
                                  : item.message}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <View style={styles.senderDetails}>
                          <View
                            style={{
                              position: "relative",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            {loadingImage.get(`messageProfiles-${index}`) ===
                              true && (
                              <ActivityIndicator
                                style={{
                                  position: "absolute",
                                  zIndex: 1,
                                }}
                              />
                            )}

                            <Image
                              source={{
                                uri: groupmembers.find(
                                  (member) => member.username === item.sender
                                )?.image,
                              }}
                              style={styles.senderImage}
                              onLoadStart={() => {
                                // setLoadingImage((prevMap) => {
                                //   const newMap = new Map(prevMap);
                                //   newMap.set(`messageProfiles-${index}`, true);
                                //   return newMap;
                                // });
                              }}
                              onLoadEnd={() => {
                                // setTimeout(() => {
                                //   setLoadingImage((prevMap) => {
                                //     const newMap = new Map(prevMap);
                                //     newMap.set(`messageProfiles-${index}`, false);
                                //     return newMap;
                                //   });
                                // }, 5);
                              }}
                            />
                          </View>

                          <Text
                            style={[
                              styles.senderName,
                              {
                                color:
                                  item.sender === username
                                    ? "#c8edfd"
                                    : "yellow",
                              },
                            ]}
                          >
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
                          >
                            {formatTime(item.timeStamp)}
                          </Text>
                        </View>

                        <View
                          style={{
                            ...styles.mediaGrid,
                            marginLeft: 45,
                            marginTop: -22,
                            alignItems: "center",
                            flexDirection: "row",
                            borderWidth: 1,
                            backgroundColor: "#151515",
                            borderRadius: 10,
                            padding: 10,
                            marginTop: -15,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => handleOpenPDF(item.document)}
                            key={index}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Image
                              source={{
                                uri: item.cover_image,
                              }}
                              style={{
                                width: 30,
                                height: 30,
                                marginRight: 10,
                              }}
                            />

                            <Text
                              style={{
                                color: "white",
                                fontSize: 15,
                                fontFamily: "Red Hat Display",
                              }}
                            >
                              {item.message.length > 10
                                ? `${item.message.substring(0, 10)}...pdf`
                                : item.message}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              } else if (item.type === "image") {
                return (
                  <View key={index}>
                    {item.grouped ? (
                      <Pressable
                        key={index}
                        style={[
                          item.images[0].sender === username
                            ? {
                                alignSelf: "flex-end",
                                backgroundColor: "black",
                                padding: 8,
                                borderRadius: 7,
                              }
                            : {
                                alignSelf: "flex-start",
                                backgroundColor: "black",
                                padding: 8,
                                borderRadius: 7,
                              },
                        ]}
                      >
                        <View>
                          <View style={styles.senderDetails}>
                            <View
                              style={{
                                position: "relative",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {loadingImage.get(`messageProfiles-${index}`) ===
                                true && (
                                <ActivityIndicator
                                  style={{
                                    position: "absolute",
                                    zIndex: 1,
                                  }}
                                />
                              )}

                              <Image
                                source={{
                                  uri: groupmembers.find(
                                    (member) =>
                                      member.username === item.images[0].sender
                                  )?.image,
                                }}
                                style={styles.senderImage}
                                onLoadStart={() => {
                                  // setLoadingImage((prevMap) => {
                                  //   const newMap = new Map(prevMap);
                                  //   newMap.set(
                                  //     `messageProfiles-${index}`,
                                  //     true
                                  //   );
                                  //   return newMap;
                                  // });
                                }}
                                onLoadEnd={() => {
                                  // setTimeout(() => {
                                  //   setLoadingImage((prevMap) => {
                                  //     const newMap = new Map(prevMap);
                                  //     newMap.set(
                                  //       `messageProfiles-${index}`,
                                  //       false
                                  //     );
                                  //     return newMap;
                                  //   });
                                  // }, 5);
                                }}
                              />
                            </View>

                            <Text
                              style={[
                                styles.senderName,
                                {
                                  color:
                                    item.images[0].sender === username
                                      ? "#c8edfd"
                                      : "yellow",
                                },
                              ]}
                            >
                              {item.images[0].sender === username
                                ? "You"
                                : item.images[0].sender}
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
                              {formatTime(item.images[0].timeStamp)}
                            </Text>
                          </View>

                          <View
                            style={{
                              ...styles.mediaGrid,
                              marginLeft: 45,
                              marginTop: -22,
                            }}
                          >
                            {item.images.map((item_, index_) => {
                              return (
                                <View key={index_}>
                                  {item_.error === true ? (
                                    <TouchableOpacity
                                      onPress={() => {
                                        handleImagesSubmit(
                                          item_.image_data,
                                          new Date(item_.timeStamp),
                                          id,
                                          setRetryUploadingMap,
                                          setMessages,
                                          socket,
                                          username,
                                          message,
                                          true,
                                          index,
                                          true,
                                          index_,
                                          item_._id
                                        );
                                      }}
                                    >
                                      <View
                                        style={{
                                          position: "relative",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}
                                      >
                                        {loadingImage.get(
                                          `messageImages-${index_}`
                                        ) === true && (
                                          <ActivityIndicator
                                            style={{
                                              position: "absolute",
                                              zIndex: 1,
                                            }}
                                          />
                                        )}

                                        <View
                                          style={{
                                            position: "absolute",
                                            zIndex: 1,
                                          }}
                                        >
                                          {retryUploadingMap.get(
                                            `retryUploading-${index_}`
                                          ) ? (
                                            <ActivityIndicator
                                              color={"green"}
                                              size={"large"}
                                            ></ActivityIndicator>
                                          ) : (
                                            <Text
                                              style={{
                                                color: "red",
                                                fontSize: 20,
                                                marginBottom: 50,
                                              }}
                                            >
                                              {"Retry"}
                                            </Text>
                                          )}
                                        </View>

                                        <Image
                                          source={{ uri: item_.image }}
                                          style={{
                                            width: 100,
                                            height: 100,
                                            margin: 2,
                                            borderRadius: 10,
                                          }}
                                          resizeMode="cover"
                                          onLoadStart={() => {
                                            setLoadingImage((prevMap) => {
                                              const newMap = new Map(prevMap);
                                              newMap.set(
                                                `messageImages-${index_}`,
                                                true
                                              );
                                              return newMap;
                                            });
                                          }}
                                          onLoadEnd={() => {
                                            setTimeout(() => {
                                              setLoadingImage((prevMap) => {
                                                const newMap = new Map(prevMap);
                                                newMap.set(
                                                  `messageImages-${index_}`,
                                                  false
                                                );
                                                return newMap;
                                              });
                                            }, 5);
                                          }}
                                        />
                                      </View>
                                    </TouchableOpacity>
                                  ) : (
                                    <TouchableOpacity
                                      onPress={() =>
                                        openImageModal(item_.image, "image")
                                      }
                                    >
                                      <View
                                        style={{
                                          position: "relative",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}
                                      >
                                        {loadingImage.get(
                                          `messageImages-${index_}`
                                        ) === true && (
                                          <ActivityIndicator
                                            style={{
                                              position: "absolute",
                                              zIndex: 1,
                                            }}
                                          />
                                        )}

                                        <Image
                                          source={{ uri: item_.image }}
                                          style={{
                                            width: 100,
                                            height: 100,
                                            margin: 2,
                                            borderRadius: 10,
                                          }}
                                          resizeMode="cover"
                                          onLoadStart={() => {
                                            setLoadingImage((prevMap) => {
                                              const newMap = new Map(prevMap);
                                              newMap.set(
                                                `messageImages-${index_}`,
                                                true
                                              );
                                              return newMap;
                                            });
                                          }}
                                          onLoadEnd={() => {
                                            setTimeout(() => {
                                              setLoadingImage((prevMap) => {
                                                const newMap = new Map(prevMap);
                                                newMap.set(
                                                  `messageImages-${index_}`,
                                                  false
                                                );
                                                return newMap;
                                              });
                                            }, 5);
                                          }}
                                        />
                                      </View>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </Pressable>
                    ) : (
                      <Pressable
                        key={index}
                        style={[
                          item.sender === username
                            ? {
                                alignSelf: "flex-end",
                                backgroundColor: "black",
                                padding: 8,
                                borderRadius: 7,
                              }
                            : {
                                alignSelf: "flex-start",
                                backgroundColor: "black",
                                padding: 8,
                                borderRadius: 7,
                              },
                        ]}
                      >
                        <View>
                          <View style={styles.senderDetails}>
                            <View
                              style={{
                                position: "relative",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {loadingImage.get(`messageProfiles-${index}`) ===
                                true && (
                                <ActivityIndicator
                                  style={{
                                    position: "absolute",
                                    zIndex: 1,
                                  }}
                                />
                              )}

                              <Image
                                source={{
                                  uri: groupmembers.find(
                                    (member) => member.username === item.sender
                                  )?.image,
                                }}
                                style={styles.senderImage}
                                onLoadStart={() => {
                                  // setLoadingImage((prevMap) => {
                                  //   const newMap = new Map(prevMap);
                                  //   newMap.set(
                                  //     `messageProfiles-${index}`,
                                  //     true
                                  //   );
                                  //   return newMap;
                                  // });
                                }}
                                onLoadEnd={() => {
                                  // setTimeout(() => {
                                  //   setLoadingImage((prevMap) => {
                                  //     const newMap = new Map(prevMap);
                                  //     newMap.set(
                                  //       `messageProfiles-${index}`,
                                  //       false
                                  //     );
                                  //     return newMap;
                                  //   });
                                  // }, 5);
                                }}
                              />
                            </View>

                            <Text
                              style={[
                                styles.senderName,
                                {
                                  color:
                                    item.sender === username
                                      ? "#c8edfd"
                                      : "yellow",
                                },
                              ]}
                            >
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
                            >
                              {formatTime(item.timeStamp)}
                            </Text>
                          </View>

                          <View
                            style={{
                              ...styles.mediaGrid,
                              marginLeft: 45,
                              marginTop: -22,
                            }}
                          >
                            {item.error === true ? (
                              <TouchableOpacity
                                onPress={() => {
                                  handleImagesSubmit(
                                    item.image_data,
                                    new Date(item.timeStamp),
                                    id,
                                    setRetryUploadingMap,
                                    setMessages,
                                    socket,
                                    username,
                                    message,
                                    true,
                                    index,
                                    false,
                                    0,
                                    item._id
                                  );
                                }}
                              >
                                <View
                                  style={{
                                    position: "relative",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  {loadingImage.get(
                                    `messageImages-${index}`
                                  ) === true && (
                                    <ActivityIndicator
                                      style={{
                                        position: "absolute",
                                        zIndex: 1,
                                      }}
                                    />
                                  )}

                                  <View
                                    style={{
                                      position: "absolute",
                                      zIndex: 1,
                                    }}
                                  >
                                    {retryUploadingMap.get(
                                      `retryUploading-${index}`
                                    ) ? (
                                      <ActivityIndicator
                                        color={"green"}
                                        size={"large"}
                                      ></ActivityIndicator>
                                    ) : (
                                      <Text
                                        style={{
                                          color: "red",
                                          fontSize: 20,
                                          marginBottom: 50,
                                        }}
                                      >
                                        {"Retry"}
                                      </Text>
                                    )}
                                  </View>

                                  <Image
                                    source={{ uri: item.image }}
                                    style={{
                                      width: 100,
                                      height: 100,
                                      margin: 2,
                                      borderRadius: 10,
                                    }}
                                    resizeMode="cover"
                                    onLoadStart={() => {
                                      setLoadingImage((prevMap) => {
                                        const newMap = new Map(prevMap);
                                        newMap.set(
                                          `messageImages-${index}`,
                                          true
                                        );
                                        return newMap;
                                      });
                                    }}
                                    onLoadEnd={() => {
                                      setTimeout(() => {
                                        setLoadingImage((prevMap) => {
                                          const newMap = new Map(prevMap);
                                          newMap.set(
                                            `messageImages-${index}`,
                                            false
                                          );
                                          return newMap;
                                        });
                                      }, 5);
                                    }}
                                  />
                                </View>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                key={index}
                                onPress={() =>
                                  openImageModal(item.image, "image")
                                }
                              >
                                <View
                                  style={{
                                    position: "relative",
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  {loadingImage.get(
                                    `messageImages-${index}`
                                  ) === true && (
                                    <ActivityIndicator
                                      style={{
                                        position: "absolute",
                                        zIndex: 1,
                                      }}
                                    />
                                  )}

                                  <Image
                                    source={{ uri: item.image }}
                                    style={{
                                      width: 100,
                                      height: 100,
                                      margin: 2,
                                      borderRadius: 10,
                                    }}
                                    resizeMode="cover"
                                    onLoadStart={() => {
                                      setLoadingImage((prevMap) => {
                                        const newMap = new Map(prevMap);
                                        newMap.set(
                                          `messageImages-${index}`,
                                          true
                                        );
                                        return newMap;
                                      });
                                    }}
                                    onLoadEnd={() => {
                                      setTimeout(() => {
                                        setLoadingImage((prevMap) => {
                                          const newMap = new Map(prevMap);
                                          newMap.set(
                                            `messageImages-${index}`,
                                            false
                                          );
                                          return newMap;
                                        });
                                      }, 5);
                                    }}
                                  />
                                </View>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    )}
                  </View>
                );
              } else if (item.type === "video") {
                return (
                  <Pressable
                    key={index}
                    style={[
                      item.sender === username
                        ? {
                            alignSelf: "flex-end",
                            backgroundColor: "black",
                            padding: 8,
                            borderRadius: 7,
                          }
                        : {
                            alignSelf: "flex-start",
                            backgroundColor: "black",
                            padding: 8,
                            borderRadius: 7,
                          },
                    ]}
                  >
                    <View>
                      <View style={styles.senderDetails}>
                        <View
                          style={{
                            position: "relative",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {loadingImage.get(`messageProfiles-${index}`) ===
                            true && (
                            <ActivityIndicator
                              style={{
                                position: "absolute",
                                zIndex: 1,
                              }}
                            />
                          )}

                          <Image
                            source={{
                              uri: groupmembers.find(
                                (member) => member.username === item.sender
                              )?.image,
                            }}
                            style={styles.senderImage}
                            onLoadStart={() => {
                              // setLoadingImage((prevMap) => {
                              //   const newMap = new Map(prevMap);
                              //   newMap.set(`messageProfiles-${index}`, true);
                              //   return newMap;
                              // });
                            }}
                            onLoadEnd={() => {
                              // setTimeout(() => {
                              //   setLoadingImage((prevMap) => {
                              //     const newMap = new Map(prevMap);
                              //     newMap.set(`messageProfiles-${index}`, false);
                              //     return newMap;
                              //   });
                              // }, 5);
                            }}
                          />
                        </View>

                        <Text
                          style={[
                            styles.senderName,
                            {
                              color:
                                item.sender === username ? "#c8edfd" : "yellow",
                            },
                          ]}
                        >
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
                        >
                          {formatTime(item.timeStamp)}
                        </Text>
                      </View>

                      <View
                        style={{
                          ...styles.mediaGrid,
                          marginLeft: 45,
                          marginTop: -22,
                        }}
                      >
                        {item.error === true ? (
                          <TouchableOpacity
                            onPress={() => {
                              handleVideoSubmit(
                                item.video_data,
                                id,
                                setRetryUploadingMap,
                                setMessages,
                                message,
                                username,
                                socket,
                                new Date(item.timeStamp),
                                true,
                                index,
                                item._id
                              );
                            }}
                          >
                            <View
                              style={{
                                position: "relative",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  position: "absolute",
                                  zIndex: 1,
                                }}
                              >
                                {retryUploadingMap.get(
                                  `retryUploading-${index}`
                                ) ? (
                                  <ActivityIndicator
                                    color={"green"}
                                    size={"large"}
                                  ></ActivityIndicator>
                                ) : (
                                  <Text
                                    style={{
                                      color: "red",
                                      fontSize: 20,
                                      marginBottom: 50,
                                    }}
                                  >
                                    {"Retry"}
                                  </Text>
                                )}
                              </View>

                              <Video
                                source={{ uri: item.video }}
                                ref={videoRef}
                                resizeMode="cover"
                                isLooping
                                style={{
                                  width: 100,
                                  height: 100,
                                  margin: 2,
                                  borderRadius: 10,
                                  marginTop: 8,
                                }}
                              />
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            key={index}
                            onPress={() => openImageModal(item.video, "video")}
                          >
                            <Video
                              source={{ uri: item.video }}
                              ref={videoRef}
                              resizeMode="cover"
                              isLooping
                              style={{
                                width: 100,
                                height: 100,
                                margin: 2,
                                borderRadius: 10,
                                marginTop: 8,
                              }}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              }
            })}
          </ScrollView>
        )}

        {isModalVisible && (
          <Modal
            visible={isModalVisible}
            transparent={false}
            style={{
              justifyContent: "flex-end",
              margin: 0,
              backgroundColor: "black",
            }}
          >
            <TouchableOpacity
              style={styles.backIcon_2}
              onPress={() => {
                closeImageModal();
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

            {selectedImage && (
              <TouchableOpacity
                style={styles.fullImageContainer}
                onPress={closeImageModal}
              >
                <View
                  style={{
                    position: "relative",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {loadingImage.get(`selectedImage`) === true && (
                    <ActivityIndicator
                      style={{
                        position: "absolute",
                        zIndex: 1,
                      }}
                    />
                  )}

                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.fullImage}
                    resizeMode="contain"
                    onLoadStart={() => {
                      setLoadingImage((prevMap) => {
                        const newMap = new Map(prevMap);
                        newMap.set(`selectedImage`, true);
                        return newMap;
                      });
                    }}
                    onLoadEnd={() => {
                      setTimeout(() => {
                        setLoadingImage((prevMap) => {
                          const newMap = new Map(prevMap);
                          newMap.set(`selectedImage`, false);
                          return newMap;
                        });
                      }, 5);
                    }}
                  />
                </View>
              </TouchableOpacity>
            )}

            {selectedImage && (
              <TouchableOpacity
                style={styles.fullImageContainer}
                onPress={closeImageModal}
              >
                <View style={styles.imageWrapper}>
                  <View
                    style={{
                      position: "relative",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {loadingImage.get(`selectedImageFull`) === true && (
                      <ActivityIndicator
                        style={{
                          position: "absolute",
                          zIndex: 1,
                        }}
                      />
                    )}

                    <Image
                      source={{ uri: selectedImage }}
                      style={styles.fullImage}
                      resizeMode="contain"
                      onLoadStart={() => {
                        setLoadingImage((prevMap) => {
                          const newMap = new Map(prevMap);
                          newMap.set(`selectedImageFull`, true);
                          return newMap;
                        });
                      }}
                      onLoadEnd={() => {
                        setTimeout(() => {
                          setLoadingImage((prevMap) => {
                            const newMap = new Map(prevMap);
                            newMap.set(`selectedImageFull`, false);
                            return newMap;
                          });
                        }, 5);
                      }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {selectedVideo && (
              <View style={styles.fullVideoContainer}>
                <TouchableOpacity onPress={handleVideoPress}>
                  <View style={styles.videoWrapper}>
                    <Video
                      source={{ uri: selectedVideo }}
                      ref={modalVideoRef}
                      style={styles.fullVideo}
                      resizeMode="contain"
                    />
                    {!isPlaying && (
                      <View style={styles.playButtonContainer}>
                        <Svg viewBox="0 0 24 24" width={40} height={40}>
                          <Path d="M0 0h24v24H0z" fill="none" />
                          <Path fill="white" d="M8 5v14l11-7z" />
                        </Svg>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* {selectedVideo && (
              <>
                {videoSaving ? (
                  <View style={styles.saveButtonContainer}>
                    <ActivityIndicator />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.saveButtonContainer}
                    onPress={saveVideoToGallery}
                  >
                    <Text style={{ color: "white" }}>Save</Text>
                  </TouchableOpacity>
                )}
              </>
            )} */}

            {selectedImage && (
              <>
                {imageSaving ? (
                  <View style={styles.saveButtonContainer}>
                    <ActivityIndicator />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.saveButtonContainer}
                    onPress={saveMediaToGallery}
                  >
                    <Text style={{ color: "white" }}>Save</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Modal>
        )}

        {isModalTwoVisible && (
          <Modal
            animationType="slide"
            transparent={true}
            swipeDirection="down"
            onSwipeComplete={ToggleModalTwo}
            onBackdropPress={ToggleModalTwo}
            visible={isModalTwoVisible}
            onRequestClose={() => {
              ToggleModalTwo();
            }}
            style={{ justifyContent: "flex-end", margin: 0 }}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.UploadCardOuter}>
                <TouchableOpacity
                  style={styles.uploadCard}
                  onPress={() => {
                    pickImage(
                      ToggleModalTwo,
                      setImageUploading,
                      setRetryUploadingMap,
                      id,
                      setMessages,
                      socket,
                      groupType,
                      dispatch,
                      username,
                      message
                    );
                  }}
                >
                  <Svg
                    viewBox="0 0 512 512"
                    width={30}
                    height={30}
                    style={{ backgroundColor: "#151515" }}
                  >
                    <Path
                      fill="white"
                      d="M64 64V48C64 39.16 71.16 32 80 32H144C152.8 32 160 39.16 160 48V64H192L242.5 38.76C251.4 34.31 261.2 32 271.1 32H448C483.3 32 512 60.65 512 96V416C512 451.3 483.3 480 448 480H64C28.65 480 0 451.3 0 416V128C0 92.65 28.65 64 64 64zM220.6 121.2C211.7 125.7 201.9 128 192 128H64V192H178.8C200.8 176.9 227.3 168 256 168C284.7 168 311.2 176.9 333.2 192H448V96H271.1L220.6 121.2zM256 216C207.4 216 168 255.4 168 304C168 352.6 207.4 392 256 392C304.6 392 344 352.6 344 304C344 255.4 304.6 216 256 216z"
                    />
                  </Svg>
                  <Text style={styles.uploadText}>Images</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadCard}
                  onPress={() => {
                    pickVideos(
                      ToggleModalTwo,
                      setVideoUploading,
                      setRetryUploadingMap,
                      id,
                      setMessages,
                      groupType,
                      message,
                      username,
                      dispatch,
                      socket
                    );
                  }}
                >
                  <Svg
                    viewBox="0 0 512 512"
                    width={30}
                    height={30}
                    style={{ backgroundColor: "#151515" }}
                  >
                    <Path
                      fill="white"
                      d="M64 64V48C64 39.16 71.16 32 80 32H144C152.8 32 160 39.16 160 48V64H192L242.5 38.76C251.4 34.31 261.2 32 271.1 32H448C483.3 32 512 60.65 512 96V416C512 451.3 483.3 480 448 480H64C28.65 480 0 451.3 0 416V128C0 92.65 28.65 64 64 64zM220.6 121.2C211.7 125.7 201.9 128 192 128H64V192H178.8C200.8 176.9 227.3 168 256 168C284.7 168 311.2 176.9 333.2 192H448V96H271.1L220.6 121.2zM256 216C207.4 216 168 255.4 168 304C168 352.6 207.4 392 256 392C304.6 392 344 352.6 344 304C344 255.4 304.6 216 256 216z"
                    />
                  </Svg>
                  <Text style={styles.uploadText}>Videos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadCard}
                  onPress={() => {
                    pickDocument(
                      ToggleModalTwo,
                      setDocumentUploading,
                      setRetryUploadingMap,
                      id,
                      setMessages,
                      socket,
                      dispatch,
                      groupType,
                      username
                    );
                  }}
                >
                  <Svg viewBox="0 0 24 24" width={30} height={30}>
                    <Path fill="#151515" d="M0 0h24v24H0z"></Path>
                    <Path
                      fill="white"
                      d="M3 6H1v13c0 1.1.9 2 2 2h17v-2H3V6z"
                    ></Path>
                    <Path
                      fill="white"
                      d="M21 4h-7l-2-2H7c-1.1 0-1.99.9-1.99 2L5 15c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"
                    ></Path>
                  </Svg>
                  <Text style={styles.uploadText}>Files</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingVertical: 10,
          }}
        >
          {imageUploading || videoUploading || documentUploading ? (
            <ActivityIndicator></ActivityIndicator>
          ) : (
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Pressable
                onPress={() => {
                  ToggleModalTwo();
                }}
                style={styles.uploadButton}
              >
                <Svg viewBox="0 0 448 512" width={15} height={15}>
                  <Path
                    fill="white"
                    d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"
                  ></Path>
                </Svg>
              </Pressable>
            </View>
          )}

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.inputbox,
                    { height: Math.max(40, inputHeight) },
                  ]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Type a message"
                  placeholderTextColor="gray"
                  multiline={true}
                  onContentSizeChange={handleContentSizeChangeText}
                />

                <Pressable
                  onPress={() =>
                    handleTextSubmit(
                      setMessageGoing,
                      socket,
                      message,
                      username,
                      id,
                      setMessages,
                      setMessage,
                      groupType,
                      dispatch
                    )
                  }
                  disabled={messageGoing ? true : false}
                  style={styles.sendButton}
                >
                  {messageGoing ? (
                    <ActivityIndicator></ActivityIndicator>
                  ) : (
                    <Svg viewBox="0 0 384 512" width={15} height={15}>
                      <Path
                        fill="white"
                        d="M374.6 246.6C368.4 252.9 360.2 256 352 256s-16.38-3.125-22.62-9.375L224 141.3V448c0 17.69-14.33 31.1-31.1 31.1S160 465.7 160 448V141.3L54.63 246.6c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0l160 160C387.1 213.9 387.1 234.1 374.6 246.6z"
                      ></Path>
                    </Svg>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatMessagesScreen;
