import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./reducers/auth-slice";
import getbaseUrlReducer from "./reducers/getbaseUrlReducer";
import notificationSlice from "./reducers/notification-slice";
import handleUseffect from "./reducers/handleUseffect";
import handleImageLoading from "./reducers/handleImageLoading";
import socketSlice from "./reducers/socketSlice";
import handleGroupVisit from "./reducers/groupVisitedMap";
import handleSqlite from "./reducers/sqliteReducer";
import notificationTokenSlice from "./reducers/notificationTokenSlice";

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    notification: notificationSlice.reducer,
    handleGroupVisit: handleGroupVisit.reducer,
    baseUrl: getbaseUrlReducer.reducer,
    handleUseffect: handleUseffect.reducer,
    handleImageLoading: handleImageLoading.reducer,
    socket: socketSlice.reducer,
    sqlite: handleSqlite.reducer,
    notificationToken: notificationTokenSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ["socket.instance", "sqlite.dbInstance"],
        ignoredActions: ["socket/setSocket", "sqlite/setSqliteInstance"],
      },
    }),
});

export default store;
