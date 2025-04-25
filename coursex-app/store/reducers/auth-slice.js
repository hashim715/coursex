import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const fetchToken = createAsyncThunk("auth/fetchToken", async () => {
  try {
    let token = await AsyncStorage.getItem("token");
    if (token !== null) {
      token = JSON.parse(token);
      return token;
    } else {
      return null;
    }
  } catch (err) {
    return null;
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: null,
    isLoggedIn: false,
  },
  reducers: {
    setToken(state, action) {
      const { token } = action.payload;
      if (token !== null) {
        state.token = token;
        state.isLoggedIn = true;
      } else {
        state.token = null;
        state.isLoggedIn = false;
        removeToken();
      }
    },
    login(state, action) {
      const { token } = action.payload;
      state.token = token;
      state.isLoggedIn = true;
    },
    logout(state) {
      state.token = null;
      state.isLoggedIn = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchToken.fulfilled, (state, action) => {
      const token = action.payload;
      if (token !== null) {
        state.token = token;
        state.isLoggedIn = true;
      } else {
        state.token = null;
        state.isLoggedIn = false;
      }
    });
  },
});

export const authActions = authSlice.actions;
export default authSlice;
