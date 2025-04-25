import { createSlice } from "@reduxjs/toolkit";

const notificationTokenSlice = createSlice({
  name: "notificationToken",
  initialState: { token: null },
  reducers: {
    setnotificationToken(state, action) {
      const { token } = action.payload;
      state.token = token;
    },
  },
});

export const notificationTokenAction = notificationTokenSlice.actions;
export default notificationTokenSlice;
