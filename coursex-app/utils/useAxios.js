import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import * as jwtDecodeModule from "jwt-decode";
import dayjs from "dayjs";
import { authActions } from "../store/reducers/auth-slice";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

const useAxios = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { token } = useSelector((state) => state.auth);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const axiosInstance = axios.create({
    url: baseURL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  axiosInstance.interceptors.request.use(async (req) => {
    try {
      const user = jwtDecodeModule.jwtDecode(token);
      const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;
      if (!isExpired) {
        return req;
      } else {
        try {
          const response = await axios.post(`${baseURL}/api/token/refresh/`, {
            token: token,
          });
          const data = await response.data;
          await AsyncStorage.setItem("token", JSON.stringify(token));
          req.headers.Authorization = `Bearer ${data.token}`;
          dispatch(authActions.login({ token: data.token }));
          return req;
        } catch (error) {
          await AsyncStorage.clear();
          dispatch(authActions.logout());
          Alert.alert(
            "Session Expired",
            "Your session expired try to login again..."
          );
        }
      }
    } catch (error) {
      await AsyncStorage.clear();
      dispatch(authActions.logout());
    }
  });
  return axiosInstance;
};

export default useAxios;
