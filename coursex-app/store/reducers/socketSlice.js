import { createSlice } from "@reduxjs/toolkit";

const socketSlice = createSlice({
  name: "socket",
  initialState: {
    instance: null,
    isConnected: false,
  },
  reducers: {
    setSocket(state, action) {
      const { socket } = action.payload;
      state.instance = socket;
    },
  },
});

export const socketActions = socketSlice.actions;
export default socketSlice;
