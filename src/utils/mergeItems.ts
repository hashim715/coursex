import { Event, Album } from "./dataTypes";

const addNewField = (
  array: Array<Event> | Array<Album>,
  sourceName: string
): Array<Event> | Array<Album> => {
  return array.map((item: any) => ({
    ...item,
    type: `${sourceName}`,
  }));
};

export const mergeItems = (
  arr: Array<Event>,
  arr2: Array<Album>
): Array<Event | Album> => {
  const updatedArray1 = addNewField(arr, "event");
  const updatedArray2 = addNewField(arr2, "album");

  const mergedData: Array<Event | Album> = [...updatedArray1, ...updatedArray2];

  return mergedData;
};
