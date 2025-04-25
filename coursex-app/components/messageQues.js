import AsyncStorage from "@react-native-async-storage/async-storage";
import { asyncStorageMutex } from "./mutexCode";

let messageQueue = Promise.resolve();

export const queueMessageSave = (message, id, push = false) => {
  messageQueue = messageQueue.then(async () => {
    let messages_async = await AsyncStorage.getItem(`messages_${id}`);
    messages_async = messages_async ? JSON.parse(messages_async) : [];
    if (!push) {
      let recentIndex = messages_async.length - 1;
      if (messages_async[recentIndex] !== undefined) {
        messages_async[recentIndex] = message;
      } else {
        messages_async.push(message);
      }
    } else {
      messages_async.push(message);
    }

    await AsyncStorage.setItem(
      `messages_${id}`,
      JSON.stringify(messages_async)
    );
  });
};

let retrymessageQueue = Promise.resolve();

export const queueMessageRetrySave = (
  retry_index,
  type,
  url,
  id,
  grid_index = 0,
  grid = false
) => {
  retrymessageQueue = retrymessageQueue.then(async () => {
    try {
      let messages_async = await AsyncStorage.getItem(`messages_${id}`);
      messages_async = messages_async ? JSON.parse(messages_async) : [];
      if (type === "image") {
        if (grid) {
          messages_async[retry_index].images[grid_index].error = false;
          messages_async[retry_index].images[grid_index].image = url;
        } else {
          messages_async[retry_index].error = false;
          messages_async[retry_index].image = url;
        }
      } else if (type === "document") {
        messages_async[retry_index].document = url;
        messages_async[retry_index].error = false;
      } else if (type === "video") {
        messages_async[retry_index].video = url;
        messages_async[retry_index].error = false;
      }

      await AsyncStorage.setItem(
        `messages_${id}`,
        JSON.stringify(messages_async)
      );
    } catch (error) {
      console.log(error);
    } finally {
    }
  });
};

let uploadingImageMessagingQueue = Promise.resolve();

export const uploadImageMessageQue = (value) => {
  uploadingImageMessagingQueue = uploadingImageMessagingQueue.then(async () => {
    await AsyncStorage.setItem(`image-uploading`, JSON.stringify(value));
  });
};

let uploadingDocumentMessagingQueue = Promise.resolve();

export const uploadDocumentMessageQue = (value) => {
  uploadingDocumentMessagingQueue = uploadingDocumentMessagingQueue.then(
    async () => {
      await AsyncStorage.setItem(`document-uploading`, JSON.stringify(value));
    }
  );
};

let uploadingVideoMessagingQueue = Promise.resolve();

export const uploadVideoMessageQue = (value) => {
  uploadingVideoMessagingQueue = uploadingVideoMessagingQueue.then(async () => {
    await AsyncStorage.setItem(`video-uploading`, JSON.stringify(value));
  });
};
