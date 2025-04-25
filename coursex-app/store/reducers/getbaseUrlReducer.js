import { createSlice } from "@reduxjs/toolkit";

const getbaseUrlReducer = createSlice({
  name: "baseUrl",
  initialState: { url: "https://backend.coursex.us" },
});

export default getbaseUrlReducer;

// "http://10.11.216.51:5000"
// "http://192.168.10.20:5000"
//
// "http://51.8.73.83"
// "http://192.168.100.16:5000"
//
