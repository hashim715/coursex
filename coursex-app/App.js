import { StyleSheet } from "react-native";
import StackNavigator from "./stackNavigator";
import { Provider } from "react-redux";
import store from "./store/store";
import { useDispatch } from "react-redux";
import { fetchToken } from "./store/reducers/auth-slice";
import { useEffect } from "react";
import messaging from "@react-native-firebase/messaging";
import React from "react";
import notifee from "@notifee/react-native";

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchToken());
  }, [dispatch]);

  useEffect(() => {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log(remoteMessage);

      await notifee.displayNotification({
        title: "Notification Title",
        body: remoteMessage.data.body,
        android: {
          channelId,
          smallIcon: "name-of-a-small-icon",
          pressAction: {
            id: "default",
          },
        },
      });
    });
  }, []);

  return <StackNavigator></StackNavigator>;
};

export default function RootApp() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
