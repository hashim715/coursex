import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileIcon from "./screens/bottomIcons/profileIcon";
import ChatIcon from "./screens/bottomIcons/chatsIcon";
import DiscoverIcon from "./screens/bottomIcons/discoverIcon";
import { Text } from "react-native";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs(true);

// Screens
import ChatScreen from "./screens/chatScreen";
import EditProfileScreen from "./screens/editprofileScreen";
import SettingScreen from "./screens/settingScreen";
import DiscoverScreen from "./screens/discoverScreen";
import IntroScreen from "./screens/introScreen";
import loginScreen from "./screens/loginScreen";
import registerScreen from "./screens/registerScreen";
import groupsScreen from "./screens/groupsScreen";
import createGroupnScreen from "./screens/createGroupScreen";
import GroupDetailsScreen from "./screens/groupDetails";
import GroupMembers from "./screens/groupMembers";
import ChatMessagesScreen from "./screens/chatMessageScreen";
import VerificationScreen from "./screens/verificationScreen";
import EmailInputScreen from "./screens/emailInputScreen";
import UserProfileScreen from "./screens/userProfileScreen";
import ProfileScreen from "./screens/profileScreen";
import ForgotPasswordScreen from "./screens/forgotPassword";
import GetProfileData from "./screens/getProfileData";
import GetBio from "./screens/getBio";
import UploadDoc from "./screens/uploadDoc";
import FlashCardList from "./screens/flashCardList";
import CreateFlash from "./screens/createFlash";
import FlashCard from "./screens/flashCard";
import ChooseGroupType from "./screens/chooseGroupType";
import GroupChatbotScreen from "./screens/groupChatbotScreen";
import ChatbotScreen from "./screens/chatBotScreen";
import ChooseLoginType from "./screens/chooseLoginType";
import LoginWithPhone from "./screens/loginWithPhone";

const chats = "chats";
const discover = "discover";
const profile = "profile";

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName={chats}
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          let rn = route.name;

          if (rn === chats) {
            IconComponent = (props) => <ChatIcon size={size} color={color} />;
          } else if (rn === discover) {
            IconComponent = (props) => (
              <DiscoverIcon size={size} color={color} />
            );
          } else if (rn === profile) {
            IconComponent = (props) => (
              <ProfileIcon size={size} color={color} />
            );
          }

          return <IconComponent />;
        },
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "grey",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "black",
          height: 90,
          borderTopWidth: 0,
          paddingTop: 10,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 5,
        },
        tabBarLabel: ({ focused, color }) => {
          let label;
          if (route.name === chats) {
            label = "home";
          } else if (route.name === discover) {
            label = "workspace";
          } else if (route.name === profile) {
            label = "profile";
          }
          return (
            <Text
              style={{
                color: focused ? "white" : "grey",
                fontSize: 12,
                paddingBottom: 5,
              }}
            >
              {label}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name={chats} component={ChatScreen} />
      <Tab.Screen name={discover} component={DiscoverScreen} />
      <Tab.Screen name={profile} component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const config = {
  screens: {
    GroupDetails: "app/groups/:id",
    Register: "app/register",
    Groups: "app/groups",
    verificationScreen: "app/verification/:email/:screen",
    NotFound: "*",
  },
};

const linking = {
  prefixes: ["https://coursex.us"],
  config,
};

const Stack = createNativeStackNavigator();

function StackNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator>
        <Stack.Screen
          name="Intro"
          component={IntroScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={registerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={loginScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Groups"
          component={groupsScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="CreateGroup"
          component={createGroupnScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="GroupDetails"
          component={GroupDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GroupMembers"
          component={GroupMembers}
          options={{ headerShown: false, gestureEnabled: true }}
        />
        <Stack.Screen
          name="ChatMessages"
          component={ChatMessagesScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="verificationScreen"
          component={VerificationScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="emailInputScreen"
          component={EmailInputScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Setting"
          component={SettingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="GetProfileData"
          component={GetProfileData}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="GetBio"
          component={GetBio}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UploadDoc"
          component={UploadDoc}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="FlashCardList"
          component={FlashCardList}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateFlash"
          component={CreateFlash}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FlashCard"
          component={FlashCard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChooseGroupType"
          component={ChooseGroupType}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="GroupChatbotScreen"
          component={GroupChatbotScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="ChatbotScreen"
          component={ChatbotScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="NotFound"
          component={() => <Text>Page Not Found</Text>}
          options={{ title: "Not Found" }}
        />
        <Stack.Screen
          name="ChooseLoginType"
          component={ChooseLoginType}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LoginWithPhone"
          component={LoginWithPhone}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default StackNavigator;
