import { createSlice } from "@reduxjs/toolkit";

const handleSqlite = createSlice({
  name: "sqlite",
  initialState: {
    dbInstance: null,
  },
  reducers: {
    setSqliteInstance(state, action) {
      const { instance } = action.payload;
      state.dbInstance = instance;
    },
  },
});

export const handleSqliteActions = handleSqlite.actions;
export default handleSqlite;
