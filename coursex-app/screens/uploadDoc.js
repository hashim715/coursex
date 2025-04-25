import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import useAxios from "../utils/useAxios";
import NetInfo from "@react-native-community/netinfo";
import { useDispatch, useSelector } from "react-redux";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import { PDFDocument } from "pdf-lib";

const { width: screenWidth } = Dimensions.get("window");

const UploadDoc = ({ route }) => {
  const { group_id, username, assistantId, assistantName, redirect } =
    route.params;
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const api = useAxios();
  const PINECONE_API_KEY =
    "pcsk_3LTyy_8cHbxpt8QhDaCaRxMh1NvFefbsg8pEcF5NCgWw3D6jw9NF5PopQ6dL8gVLdnfp";
  const baseURL = useSelector((state) => state.baseUrl.url);
  const dispatch = useDispatch();


  const uploadDocumentToAssistant = async () => {
    try {
      const form = new FormData();
      form.append("file", {
        uri: file.uri,
        name: file.name,
        type: "application/octet-stream",
      });
      const response = await axios.post(
        `https://prod-1-data.ke.pinecone.io/assistant/files/${assistantName}`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Api-Key": PINECONE_API_KEY,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.log(err);
      return null;
    }
  };

  const pickDocument = async () => {
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      });

      if (!result.canceled) {
        if (result.assets && result.assets.length > 0) {
          const fileUri = result.assets[0].uri;

          const fileType = fileUri.split(".").pop().toLowerCase();

          if (fileType === "pdf") {
            const pdfBytes = await fetch(fileUri).then((res) =>
              res.arrayBuffer()
            );
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pageCount = pdfDoc.getPageCount();

            if (pageCount <= 10) {
              setFile(result.assets[0]);
            } else {
              Alert.alert(
                "Error",
                "PDF file has more than 10 pages. Please upload a shorter document."
              );
            }
          } else {
            setFile(result.assets[0]);
          }
        } else {
          Alert.alert(
            "Error",
            "Invalid file format or missing file properties."
          );
        }
      } else {
        Alert.alert("No file selected");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while selecting the file.");
    }
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
      const document_data = await uploadDocumentToAssistant();
      if (!document_data) {
        Alert.alert("Document did not upload successfully try again....");
        setLoading(false);
        return;
      }
      const response = await api.post(
        `${baseURL}/api/knowledgeBase/uploadDocumentsToAssistant/`,
        {
          document_name: document_data.name,
          document_id: document_data.id,
          assistantId: `${assistantId}`,
          status: document_data.status,
          percent_done: `${document_data.percent_done}`,
          signed_url: document_data.signed_url,
        }
      );
      setLoading(false);
      dispatch(handleUseffectActions.setRefreshChatbotScreen({ reload: true }));
      if (redirect === "chatbot") {
        navigation.navigate("GroupChatbotScreen", {
          id: group_id,
          username: username,
        });
      } else if (redirect === "members") {
        navigation.navigate("GroupMembers", {
          id: group_id,
          username: username,
        });
      }
      Alert.alert(
        "Document uploaded successfully. Pease allow few minutes for the assistant to learn the document."
      );
    } catch (err) {
      console.log(err.response.data);
      setLoading(false);
      if (err.response.status === 503) {
        Alert.alert(err.response.data.message);
      } else {
        Alert.alert(err.response.data.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topContainer}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => {
            if (redirect === "chatbot") {
              navigation.navigate("GroupChatbotScreen", {
                id: group_id,
                username: username,
              });
            } else if (redirect === "members") {
              navigation.navigate("GroupMembers", {
                id: group_id,
                username: username,
              });
            }
          }}
          disabled={loading ? true : false}
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

      <Text style={styles.heading}>
        Add to <Text style={{ color: "yellow" }}>Sam's</Text> Knowledge Base
      </Text>
      <Text style={styles.subheader}>
        You can import your notes, PDFs, text, PowerPoints. Sam will learn all
        of it and help you ace your course.
      </Text>

      <View style={styles.Card}>
        <TouchableOpacity
          onPress={() => {
            pickDocument();
          }}
          style={styles.uploadButton}
          disabled={loading ? true : false}
        >
          <Svg viewBox="0 0 24 24" width={48} height={48} fill={"black"}>
            <Path d="M0 0h24v24H0V0z" fill="none" />
            <Path
              fill="#c2c2c2"
              d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11z"
            />
          </Svg>
          <Text style={styles.upload}>Upload</Text>
          {file && <Text style={styles.fileName}>{file.name}</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => {
          handleSubmit();
        }}
      >
        {loading ? (
          <ActivityIndicator></ActivityIndicator>
        ) : (
          <Text style={styles.buttonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#000000",
  },
  heading: {
    color: "#ffffff",
    fontSize: 25,
    fontFamily: "Red Hat Display",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 50,
    marginBottom: 20,
  },
  subheader: {
    color: "#7f7f7f",
    fontSize: 14,
    fontFamily: "Red Hat Display",
    fontWeight: "500",
    textAlign: "center",
    width: "70%",
  },
  Card: {
    width: "90%",
    height: 200,
    backgroundColor: "#151515",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#505050",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
    padding: 20,
  },
  uploadButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  upload: {
    color: "#c2c2c2",
    fontSize: 14,
    fontFamily: "Montserrat",
    fontWeight: "500",
    lineHeight: 18,
  },
  fileName: {
    color: "#c2c2c2",
    fontSize: 14,
    fontFamily: "Montserrat",
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 10,
  },
  submitButton: {
    width: "50%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    backgroundColor: "#ffffff",
    marginTop: 150,
  },
  buttonText: {
    color: "#000000",
    fontSize: 14,
    fontFamily: "Montserrat",
    fontWeight: "500",
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
  backIcon: {
    width: 25,
    height: 25,
    backgroundColor: "transparent",
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default UploadDoc;
