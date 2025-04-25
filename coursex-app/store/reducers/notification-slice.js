import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: { notification: null },
  reducers: {
    notification(state, action) {
      state.notification = {
        message: action.payload.message,
        type: action.payload.type,
        show: action.payload.show,
      };
    },
  },
});

export const notificationAction = notificationSlice.actions;
export default notificationSlice;
