import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  uploadImageMessageQue,
  uploadDocumentMessageQue,
  uploadVideoMessageQue,
} from "../components/messageQues";

import {
  handleDocumentSubmit,
  handleImagesSubmit,
  handleVideoSubmit,
} from "../components/mediaSubmitFunctions";
import * as ImageManipulator from "expo-image-manipulator";
import { handleUseffectActions } from "../store/reducers/handleUseffect";

import { Alert } from "react-native";
import { database } from "./database/createdb";
import { Q } from "@nozbe/watermelondb";

export const pickDocument = async (
  ToggleModalTwo,
  setDocumentUploading,
  setRetryUploadingMap,
  id,
  setMessages,
  socket,
  dispatch,
  groupType,
  username
) => {
  try {
    let result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      ToggleModalTwo();
      uploadDocumentMessageQue(true);
      setDocumentUploading(true);
      const tasks = [];
      const documents = [result.assets[0]];

      const documentThumbnails = await Promise.all(
        documents.map(async (doc) => {
          const { mimeType, uri, name } = doc;

          if (
            !mimeType.startsWith("image/") &&
            (mimeType.startsWith("application/") || mimeType === "text/plain")
          ) {
            let coverImage = null;

            if (mimeType === "application/pdf") {
              coverImage =
                "https://assets.api.uizard.io/api/cdn/stream/7c224ca5-e308-4182-81c9-a670d4ee7556.png";
            } else if (
              mimeType === "application/vnd.ms-powerpoint" ||
              mimeType ===
                "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            ) {
              coverImage =
                "https://tse1.mm.bing.net/th?id=OIP.r2Bs06QPptg4yJeV8PrV-gHaFj&pid=Api&P=0&h=220";
            } else if (
              mimeType === "application/msword" ||
              mimeType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
              coverImage =
                "https://www.netconfig.co.za/wp-content/uploads/2022/09/Microsoft-Word-Logo-1024x576.png";
            }

            return { ...doc, coverImage };
          }
          return null;
        })
      );
      const timeStamp = new Date();
      const validDocuments = documentThumbnails.filter(Boolean);

      for (const doc of validDocuments) {
        tasks.push(
          handleDocumentSubmit(
            doc,
            doc.name,
            id,
            setMessages,
            setRetryUploadingMap,
            socket,
            username,
            timeStamp
          )
        );
      }
      await Promise.all(tasks);
      uploadDocumentMessageQue(false);
      setDocumentUploading(false);

      const user_grp = await database
        .get("groups")
        .query(Q.where("group_id", id))
        .fetch();

      await database.write(async () => {
        await user_grp[0].update((group) => {
          group.recent_message = "document";
          group.sender = username;
        });
      });

      if (groupType === "non-course") {
        dispatch(
          handleUseffectActions.setRefreshNonCourseGroups({ reload: true })
        );
      }
    }
  } catch (err) {
    Alert.alert("Something went wrong try to upload again");
  }
};

export const pickVideos = async (
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
) => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      ToggleModalTwo();
      uploadVideoMessageQue(true);
      setVideoUploading(true);
      const tasks = [];
      const media = result.assets;
      const timeStamp = new Date();
      const videos = media.filter((item) => item.type === "video");
      for (let i = 0; i < videos.length; i++) {
        tasks.push(
          handleVideoSubmit(
            videos[i],
            id,
            setRetryUploadingMap,
            setMessages,
            message,
            username,
            socket,
            timeStamp
          )
        );
      }
      await Promise.all(tasks);
      uploadVideoMessageQue(false);
      setVideoUploading(false);

      const user_grp = await database
        .get("groups")
        .query(Q.where("group_id", id))
        .fetch();

      await database.write(async () => {
        await user_grp[0].update((group) => {
          group.recent_message = "video";
          group.sender = username;
        });
      });

      if (groupType === "non-course") {
        dispatch(
          handleUseffectActions.setRefreshNonCourseGroups({ reload: true })
        );
      }
    }
  } catch (error) {
    Alert.alert("Something went wrong try to upload again");
  }
};

export const pickImage = async (
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
) => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      ToggleModalTwo();
      uploadImageMessageQue(true);
      setImageUploading(true);
      const tasks = [];
      const media = result.assets;
      const timeStamp = new Date();
      const images = media.filter((item) => item.type === "image");
      for (let i = 0; i < images.length; i++) {
        const compressedImage = await ImageManipulator.manipulateAsync(
          images[i].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        tasks.push(
          handleImagesSubmit(
            { ...images[i], uri: compressedImage.uri },
            timeStamp,
            id,
            setRetryUploadingMap,
            setMessages,
            socket,
            username,
            message
          )
        );
      }
      await Promise.all(tasks);
      uploadImageMessageQue(false);
      setImageUploading(false);

      const user_grp = await database
        .get("groups")
        .query(Q.where("group_id", id))
        .fetch();

      await database.write(async () => {
        await user_grp[0].update((group) => {
          group.recent_message = "image";
          group.sender = username;
        });
      });

      if (groupType === "non-course") {
        dispatch(
          handleUseffectActions.setRefreshNonCourseGroups({ reload: true })
        );
      }
    }
  } catch (error) {
    console.log(error);
    Alert.alert("Something went wrong try to upload again");
  }
};
