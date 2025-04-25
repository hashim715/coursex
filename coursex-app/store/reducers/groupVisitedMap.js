import { createSlice } from "@reduxjs/toolkit";

const handleGroupVisit = createSlice({
  name: "handleGroupVisitLoadMap",
  initialState: {
    groupVisitLoadMap: {},
  },
  reducers: {
    setGroupVisitLoadingMap(state, action) {
      const { id, value } = action.payload;
      state.groupVisitLoadMap[id] = value;
    },
  },
});

export const handleGroupVisitActions = handleGroupVisit.actions;
export default handleGroupVisit;
