import { Event, Album } from "./dataTypes";

export const shuffleItems = (mergedItems: Array<Album | Event>) => {
  for (let i = mergedItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mergedItems[i], mergedItems[j]] = [mergedItems[j], mergedItems[i]];
  }
  return mergedItems;
};
