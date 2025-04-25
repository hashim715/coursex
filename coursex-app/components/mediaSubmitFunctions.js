import {
  uploadImagesToS3,
  uploadDocumentsToS3,
  uploadVideosToS3,
} from "./uploadFunctions";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import { asyncStorageMutex } from "./mutexCode";
import { Alert } from "react-native";
import { retryLoadingFunction } from "./retryLoadingFunctions";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { database } from "./database/createdb";
import { Q } from "@nozbe/watermelondb";

export const handleDocumentSubmit = async (
  document,
  document_name,
  id,
  setMessages,
  setRetryUploadingMap,
  socket,
  username,
  timeStamp,
  retry = false,
  retry_index,
  doc_id
) => {
  //await asyncStorageMutex.lock();
  try {
    if (socket) {
      const _id = uuidv4();

      let complete_message_locally = {
        message: document_name,
        sender: username,
        group_id: id,
        timeStamp: timeStamp,
        type: "document",
        document_data: document,
        document: document.uri,
        error: false,
        cover_image: document.coverImage,
        _id: _id,
      };

      if (retry) {
        await retryLoadingFunction(retry_index, true, setRetryUploadingMap);
      }

      if (!retry) {
        setMessages((prevMessages) => [
          ...prevMessages,
          complete_message_locally,
        ]);

        const { group_id, timeStamp, document_data, ...rest } =
          complete_message_locally;

        await database.write(async () => {
          await database.get("messages").create((message_) => {
            Object.assign(message_._raw, {
              ...rest,
              group_id: group_id,
              time_stamp: timeStamp.toISOString(),
              version: timeStamp.toISOString(),
              document_data: JSON.stringify(document_data),
            });
          });
        });
      }

      let document_url = await uploadDocumentsToS3(document);
      // let document_url = null;

      if (document_url !== null) {
        const complete_message = {
          message: document_name,
          sender: username,
          group_id: id,
          timeStamp: timeStamp,
          type: "document",
          document: document_url,
          cover_image: document.coverImage,
          error: false,
        };

        if (retry) {
          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", doc_id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = false;
              message_.document = complete_message.document;
              message_.document_data = null;
            });
          });

          socket.emit("message", complete_message);
        } else {
          setMessages((prevMessages) => {
            const { timeStamp, ...rest } = complete_message;
            const new_array = prevMessages.map((message) => {
              if (message._id === _id) {
                return {
                  ...message,
                  ...rest,
                  document_data: null,
                  timeStamp: timeStamp.toISOString(),
                };
              }
              return message;
            });
            return new_array;
          });

          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", _id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = false;
              message_.document = complete_message.document;
              message_.document_data = null;
            });
          });

          socket.emit("message", complete_message);
        }

        if (retry) {
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const new_array = updatedMessages.map((message) => {
              if (message._id === doc_id) {
                return {
                  ...message,
                  error: false,
                  document: document_url,
                  document_data: null,
                };
              }
              return message;
            });
            return new_array;
          });
        }
      } else {
        if (!retry) {
          setMessages((prevMessages) => {
            const new_array = prevMessages.map((message) => {
              if (message._id === _id) {
                return {
                  ...message,
                  error: true,
                };
              }
              return message;
            });
            return new_array;
          });

          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", _id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = true;
            });
          });
        }
      }
    }
  } catch (error) {
    Alert.alert("Something went wrong try to upload again");
  } finally {
    if (retry) {
      await retryLoadingFunction(retry_index, false, setRetryUploadingMap);
    }
    //asyncStorageMutex.unlock();
  }
};

export const handleImagesSubmit = async (
  image,
  timeStamp,
  id,
  setRetryUploadingMap,
  setMessages,
  socket,
  username,
  message,
  retry = false,
  retry_index = 0,
  grid = false,
  grid_index = 0,
  doc_id
) => {
  // await asyncStorageMutex.lock();
  try {
    if (socket) {
      const _id = uuidv4();

      let complete_message_locally = {
        message: message,
        sender: username,
        group_id: id,
        timeStamp: timeStamp,
        type: "image",
        image_data: image,
        image: image.uri,
        error: false,
        grouped: false,
        _id: _id,
      };

      if (!retry) {
        setMessages((prevMessages) => [
          ...prevMessages,
          complete_message_locally,
        ]);

        const { group_id, timeStamp, image_data, ...rest } =
          complete_message_locally;

        await database.write(async () => {
          await database.get("messages").create((message_) => {
            Object.assign(message_._raw, {
              ...rest,
              group_id: group_id,
              time_stamp: timeStamp.toISOString(),
              version: timeStamp.toISOString(),
              image_data: JSON.stringify(image_data),
            });
          });
        });
      }

      if (retry && grid) {
        await retryLoadingFunction(grid_index, true, setRetryUploadingMap);
      } else {
        await retryLoadingFunction(retry_index, true, setRetryUploadingMap);
      }

      let imageUrl = await uploadImagesToS3(image);
      // let imageUrl = null;

      if (imageUrl !== null) {
        const complete_message = {
          message: message,
          sender: username,
          group_id: id,
          timeStamp: timeStamp,
          type: "image",
          image: imageUrl,
          grouped: false,
          error: false,
        };

        if (retry) {
          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", doc_id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = false;
              message_.image = complete_message.image;
              message_.image_data = null;
            });
          });

          socket.emit("message", complete_message);
        } else {
          setMessages((prevMessages) => {
            const { timeStamp, ...rest } = complete_message;
            const new_array = prevMessages.map((message) => {
              if (message._id === _id) {
                return {
                  ...message,
                  ...rest,
                  image_data: null,
                  timeStamp: timeStamp.toISOString(),
                };
              }
              return message;
            });
            return new_array;
          });

          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", _id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = false;
              message_.image = complete_message.image;
              message_.image_data = null;
            });
          });

          socket.emit("message", complete_message);
        }

        if (retry && grid) {
          setMessages((prevMessages) => {
            const new_array = prevMessages.map((message, index) => {
              if (index === retry_index) {
                const new_arr = message.images.map((item, index_) => {
                  if (index_ === grid_index) {
                    return {
                      ...item,
                      error: false,
                      image: imageUrl,
                      image_data: null,
                    };
                  }
                  return item;
                });
                return { ...message, images: new_arr };
              }
              return message;
            });
            return new_array;
          });
        } else if (retry && !grid) {
          setMessages((prevMessages) => {
            const new_array = prevMessages.map((message, index) => {
              if (index === retry_index) {
                return {
                  ...message,
                  error: false,
                  image: imageUrl,
                  image_data: null,
                };
              }
              return message;
            });
            return new_array;
          });
        }
      } else {
        if (!retry) {
          setMessages((prevMessages) => {
            const new_array = prevMessages.map((message) => {
              if (message._id === _id) {
                return {
                  ...message,
                  error: true,
                };
              }
              return message;
            });
            return new_array;
          });

          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", _id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = true;
            });
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
    Alert.alert("Something went wrong try to upload again");
  } finally {
    if (retry && grid) {
      await retryLoadingFunction(grid_index, false, setRetryUploadingMap);
    } else {
      await retryLoadingFunction(retry_index, false, setRetryUploadingMap);
    }
    // asyncStorageMutex.unlock();
  }
};

export const handleVideoSubmit = async (
  video,
  id,
  setRetryUploadingMap,
  setMessages,
  message,
  username,
  socket,
  timeStamp,
  retry = false,
  retry_index = 0,
  doc_id
) => {
  //await asyncStorageMutex.lock();

  try {
    if (socket) {
      const _id = uuidv4();

      let complete_message_locally = {
        message: message,
        sender: username,
        group_id: id,
        timeStamp: timeStamp,
        type: "video",
        video_data: video,
        video: video.uri,
        error: false,
        _id: _id,
      };

      if (!retry) {
        setMessages((prevMessages) => [
          ...prevMessages,
          complete_message_locally,
        ]);

        const { group_id, video_data, timeStamp, ...rest } =
          complete_message_locally;

        await database.write(async () => {
          await database.get("messages").create((message_) => {
            Object.assign(message_._raw, {
              ...rest,
              group_id: group_id,
              time_stamp: timeStamp.toISOString(),
              version: timeStamp.toISOString(),
              video_data: JSON.stringify(video_data),
            });
          });
        });
      }

      if (retry) {
        await retryLoadingFunction(retry_index, true, setRetryUploadingMap);
      }

      let videoUrl = await uploadVideosToS3(video);
      // let videoUrl = null;

      if (videoUrl !== null) {
        const complete_message = {
          message: message,
          sender: username,
          group_id: id,
          timeStamp: timeStamp,
          type: "video",
          video: videoUrl,
          error: false,
        };

        if (retry) {
          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", doc_id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = false;
              message_.video = complete_message.video;
              message_.video_data = null;
            });
          });

          socket.emit("message", complete_message);
        } else {
          setMessages((prevMessages) => {
            const { timeStamp, ...rest } = complete_message;
            const new_array = prevMessages.map((message) => {
              if (message._id === _id) {
                return {
                  ...message,
                  ...rest,
                  video_data: null,
                  timeStamp: timeStamp.toISOString(),
                };
              }
              return message;
            });
            return new_array;
          });

          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", _id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = false;
              message_.video = complete_message.video;
              message_.video_data = null;
            });
          });

          socket.emit("message", complete_message);
        }

        if (retry) {
          setMessages((prevMessages) => {
            const new_array = prevMessages.map((message, index) => {
              if (index === retry_index) {
                return {
                  ...message,
                  error: false,
                  video: videoUrl,
                  video_data: null,
                };
              }
              return message;
            });
            return new_array;
          });
        }
      } else {
        if (!retry) {
          setMessages((prevMessages) => {
            const new_array = prevMessages.map((message) => {
              if (message._id === _id) {
                return {
                  ...message,
                  error: true,
                };
              }
              return message;
            });
            return new_array;
          });

          const user_msg = await database
            .get("messages")
            .query(Q.where("_id", _id))
            .fetch();

          await database.write(async () => {
            await user_msg[0].update((message_) => {
              message_.error = true;
            });
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
    Alert.alert("Something went wrong try to upload again");
  } finally {
    if (retry) {
      await retryLoadingFunction(retry_index, false, setRetryUploadingMap);
    }
    //asyncStorageMutex.unlock();
  }
};

export const handleTextSubmit = async (
  setMessageGoing,
  socket,
  message,
  username,
  id,
  setMessages,
  setMessage,
  groupType,
  dispatch
) => {
  try {
    setMessageGoing(true);
    if (socket) {
      const _id = uuidv4();

      if (message.length > 0 && message.trim() !== "") {
        const complete_message = {
          message: message,
          sender: username,
          group_id: id,
          timeStamp: new Date(),
          type: "text",
          _id: _id,
        };

        const { group_id, timeStamp, ...rest } = complete_message;

        await database.write(async () => {
          await database.get("messages").create((message_) => {
            Object.assign(message_._raw, {
              ...rest,
              group_id: group_id,
              time_stamp: timeStamp.toISOString(),
              version: timeStamp.toISOString(),
            });
          });
        });

        setMessages((prevMessages) => [...prevMessages, complete_message]);
        socket.emit("message", complete_message);

        const user_grp = await database
          .get("groups")
          .query(Q.where("group_id", group_id))
          .fetch();

        await database.write(async () => {
          await user_grp[0].update((group) => {
            group.recent_message = message;
            group.sender = username;
          });
        });

        setMessage("");
      }
    }
    setMessageGoing(false);
    if (groupType === "non-course") {
      dispatch(
        handleUseffectActions.setRefreshNonCourseGroups({ reload: true })
      );
    }
  } catch (err) {
    console.log(err);
    setMessageGoing(false);
  }
};
