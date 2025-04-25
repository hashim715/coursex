import AsyncStorage from "@react-native-async-storage/async-storage";

export const retryLoadingFunction = async (
  retry_index,
  value,
  setRetryUploadingMap
) => {
  setRetryUploadingMap((prevMap) => {
    const newMap = new Map(prevMap);
    newMap.set(`retryUploading-${retry_index}`, value);
    // Save the map to AsyncStorage
    const mapObject = Array.from(newMap);
    AsyncStorage.setItem("retryUploadingMap", JSON.stringify(mapObject));
    return newMap;
  });
};
