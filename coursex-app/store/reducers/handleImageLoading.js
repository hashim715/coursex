import { createSlice } from "@reduxjs/toolkit";

const handleImageLoading = createSlice({
  name: "handleImageLoading",
  initialState: {
    imageLoadingMap: {},
  },
  reducers: {
    setImageLoading(state, action) {
      const { type, name, value } = action.payload;
      const key = `${type}-${name}`;
      state.imageLoadingMap[key] = value;
    },
  },
});

export const handleImageLoadingActions = handleImageLoading.actions;
export default handleImageLoading;
