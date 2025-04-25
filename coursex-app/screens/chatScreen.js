import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Button,
  Image,
} from "react-native";
import { Path, Svg } from "react-native-svg";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LogBox } from "react-native";
import useAxios from "../utils/useAxios";
import { useSelector, useDispatch } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { handleUseffectActions } from "../store/reducers/handleUseffect";
import { socketActions } from "../store/reducers/socketSlice";
import io from "socket.io-client";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { database } from "../components/database/createdb";
import { Q } from "@nozbe/watermelondb";

LogBox.ignoreAllLogs(true);

// get the width of the screen
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const ChatsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const [groups, setGroups] = React.useState([]);
  const [non_course_groups, setNonCourseGroups] = React.useState([]);
  const baseURL = useSelector((state) => state.baseUrl.url);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const refreshGroupsScreen = useSelector(
    (state) => state.handleUseffect.refreshGroupsScreen
  );
  const refreshNonCourseGroups = useSelector(
    (state) => state.handleUseffect.refreshNonCourseGroups
  );
  const [username, setUsername] = useState("");
  const [loading, setLoading] = React.useState(false);
  const [non_course_groups_loading, setNonCourseGroupsLoading] =
    React.useState(false);
  const api = useAxios();
  const socket = useRef(null);
  const HOST = baseURL;
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [networkLoad, setnetworkLoad] = useState(false);
  const [loadingImage, setLoadingImage] = useState(new Map());
  const [fetchData, setfetchData] = useState(new Map());
  const networkErrorRef = useRef(false);
  const [reloadKey, setReloadKey] = useState(Date.now());
  const [reloadMessages, setReloadMessages] = useState(true);

  const reloadImage = () => {
    setReloadKey(Date.now());
  };

  useFocusEffect(
    useCallback(() => {
      reloadImage();
    }, [])
  );

  const handlePress = () => {
    navigation.navigate("ChooseGroupType");
  };

  const getUserName = async () => {
    try {
      let username = await AsyncStorage.getItem("username");
      username = JSON.parse(username);
      setUsername(username);
    } catch (err) {
      setUsername(null);
    }
  };

  useEffect(() => {
    getUserName();
  }, []);

  useEffect(() => {
    const connectSocket = () => {
      socket.current = io(HOST, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
      });

      socket.current.on("connect", async () => {
        console.log("connected");
        setIsConnected(true);
        setReconnectAttempts(0);
        dispatch(socketActions.setSocket({ socket: socket.current }));
      });

      socket.current.on("reconnect_attempt", () => {
        setReconnectAttempts((prev) => prev + 1);
        console.log("Reconnecting... Attempt:", reconnectAttempts + 1);
      });

      socket.current.on("reconnect_failed", () => {
        console.log("Reconnect failed");
      });
    };

    connectSocket();

    return () => {
      if (socket.current) {
        console.log("Component is unmounted");
        socket.current.disconnect();
        dispatch(socketActions.setSocket({ socket: null }));
      }
    };
  }, [reconnectAttempts]);

  const handleAddUser = useCallback(async () => {
    socket.current.emit("add-user", { username: username });
    // await syncUserMetaDatawhenOffline();
    await syncCourseGrouDataWhenOffline();
    await syncNonCourseGroupDataWhenOffline();
  }, [username]);

  const handleNetworkError = (fetchEvent, err = null) => {
    setfetchData((prevMap) => {
      const newMap = new Map(prevMap);
      newMap.set(`${fetchEvent}`, true);
      return newMap;
    });
    if (!networkErrorRef.current) {
      setnetworkLoad(true);
      networkErrorRef.current = true;
      Alert.alert(
        "Something went wrong",
        "Please retry or check your internet connection..."
      );
    }
  };

  const syncUserMetaDatawhenOffline = useCallback(async () => {
    try {
      const response = await api.get(
        `${baseURL}/api/chats/syncUserMetaDataForAllGroups`
      );
      // await Promise.all(
      //   response.data.message.map(async (group) => {
      //     // if (group.messages.length > 0) {
      //     //   const sanitized_docs = group_messages.map((message) => {
      //     //     const { __v, groupId, _id, timeStamp, ...rest } = message;
      //     //     return {
      //     //       ...rest,
      //     //       group_id: groupId,
      //     //       _id: _id,
      //     //       time_stamp: timeStamp.toISOString(),
      //     //       version: __v,
      //     //     };
      //     //   });
      //     //   await database.write(async () => {
      //     //     await database.batch(
      //     //       ...sanitized_docs.map((message) =>
      //     //         database.get("messages").prepareCreate((record) => {
      //     //           Object.assign(record._raw, message);
      //     //         })
      //     //       )
      //     //     );
      //     //   });
      //     //   if (group.type === "non-course") {
      //     //     const usergroup = await database
      //     //       .get("groups")
      //     //       .query(Q.where("group_id", group.id))
      //     //       .fetch();
      //     //     if (msg.type === "text") {
      //     //       await database.write(async () => {
      //     //         await usergroup[0].update((group) => {
      //     //           group.recent_message = msg.message;
      //     //           group.sender = msg.sender;
      //     //         });
      //     //       });
      //     //     } else {
      //     //       await database.write(async () => {
      //     //         await usergroup[0].update((group) => {
      //     //           group.recent_message = msg.type;
      //     //           group.sender = msg.sender;
      //     //         });
      //     //       });
      //     //     }
      //     //     setNonCourseGroups((prevGroups) => {
      //     //       const new_groups = prevGroups.map((group_) => {
      //     //         if (group_.id === group.id) {
      //     //           if (msg.type === "text") {
      //     //             return {
      //     //               ...group_,
      //     //               recent_message: msg.message,
      //     //               sender: msg.sender,
      //     //             };
      //     //           } else {
      //     //             return {
      //     //               ...group_,
      //     //               recent_message: msg.type,
      //     //               sender: msg.sender,
      //     //             };
      //     //           }
      //     //         }
      //     //         return group_;
      //     //       });
      //     //       return new_groups;
      //     //     });
      //     //   }
      //     // }
      //   })
      // );
    } catch (err) {
      console.log(err);
    }
  }, [username]);

  const syncCourseGrouDataWhenOffline = useCallback(async () => {
    try {
      const response = await api.get(`${baseURL}/api/user/getGroupsByUser`);

      const sanitized_docs = response.data.message.map((group) => {
        const { id, _count, createdAt, updatedAt, admins, ...rest } = group;
        return {
          ...rest,
          count: _count,
          id: id,
          admins: admins,
          createdAt: createdAt,
          updatedAt: updatedAt,
        };
      });

      setGroups(sanitized_docs);

      const sanitized_docs_ = response.data.message.map((group) => {
        const { id, _count, admins, users, updatedAt, createdAt, ...rest } =
          group;
        return {
          ...rest,
          count: JSON.stringify(_count),
          admins: JSON.stringify(admins),
          group_id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
          group_members: JSON.stringify(users),
        };
      });

      await database.write(async () => {
        const groupsToDelete = await database
          .get("groups")
          .query(Q.where("type", "course"))
          .fetch();

        await database.batch(
          ...groupsToDelete.map((group) => group.prepareDestroyPermanently())
        );
      });

      await database.write(async () => {
        await database.batch(
          ...sanitized_docs_.map((group) =>
            database.get("groups").prepareCreate((record) => {
              Object.assign(record._raw, group);
            })
          )
        );
      });
    } catch (err) {
      console.log(err);
    }
  }, [username]);

  const syncNonCourseGroupDataWhenOffline = useCallback(async () => {
    try {
      const response = await api.get(
        `${baseURL}/api/user/getNonCourseGroupsByUser`
      );

      const sanitized_docs = response.data.message.map((group) => {
        const { id, updatedAt, admins, createdAt, ...rest } = group;
        return {
          ...rest,
          id: id,
          updatedAt: updatedAt,
          createdAt: createdAt,
          admins: admins,
        };
      });

      setNonCourseGroups(sanitized_docs);

      const sanitized_docs_ = response.data.message.map((group) => {
        const { id, admins, updatedAt, createdAt, users, ...rest } = group;
        return {
          ...rest,
          admins: JSON.stringify(admins),
          group_id: id,
          createdAt: createdAt,
          updatedAt: updatedAt,
          group_members: JSON.stringify(users),
        };
      });

      await database.write(async () => {
        const groupsToDelete = await database
          .get("groups")
          .query(Q.where("type", "non-course"))
          .fetch();

        await database.batch(
          ...groupsToDelete.map((group) => group.prepareDestroyPermanently())
        );
      });

      await database.write(async () => {
        await database.batch(
          ...sanitized_docs_.map((group) =>
            database.get("groups").prepareCreate((record) => {
              Object.assign(record._raw, group);
            })
          )
        );
      });
    } catch (err) {
      console.log(err);
    }
  }, [username]);

  const handleJoinRooms = useCallback(() => {
    if (socket.current) {
      socket.current.emit("join-room", {
        username: username,
      });
    }
  }, [username, isConnected]);

  useEffect(() => {
    if (socket.current && username) {
      if (isConnected) {
        handleJoinRooms();
      }
    }
  }, [username, isConnected]);

  useEffect(() => {
    const handleDisconnect = async () => {
      console.log("disconnecting.......");
      setIsConnected(false);
      dispatch(socketActions.setSocket({ socket: null }));
    };

    const handleMessage = async (msg) => {
      try {
        if (msg.id !== socket.current.id) {
          const { id, group_id, timeStamp, ...rest } = msg;

          const _id = uuidv4();

          await database.write(async () => {
            await database.get("messages").create((message) => {
              Object.assign(message._raw, {
                ...rest,
                group_id: parseInt(group_id),
                _id: _id,
                time_stamp: timeStamp,
              });
            });
          });

          const usergroup = await database
            .get("groups")
            .query(Q.where("group_id", parseInt(group_id)))
            .fetch();

          if (usergroup.length > 0) {
            if (usergroup[0]["_raw"].type === "non-course") {
              if (msg.type === "text") {
                await database.write(async () => {
                  await usergroup[0].update((group) => {
                    group.recent_message = msg.message;
                    group.sender = msg.sender;
                  });
                });
              } else {
                await database.write(async () => {
                  await usergroup[0].update((group) => {
                    group.recent_message = msg.type;
                    group.sender = msg.sender;
                  });
                });
              }

              setNonCourseGroups((prevGroups) => {
                const new_groups = prevGroups.map((group) => {
                  if (group.id === parseInt(group_id)) {
                    if (msg.type === "text") {
                      return {
                        ...group,
                        recent_message: msg.message,
                        sender: msg.sender,
                      };
                    } else {
                      return {
                        ...group,
                        recent_message: msg.type,
                        sender: msg.sender,
                      };
                    }
                  }
                  return group;
                });
                return new_groups;
              });
            }
          }
        }
      } catch (err) {
        console.log(err);
      }
    };

    const handleGroupJoin = async (msg) => {
      try {
        if (msg.user.username !== username) {
          const { group_id, user } = msg;

          const usergroup = await database
            .get("groups")
            .query(Q.where("group_id", parseInt(group_id)))
            .fetch();

          if (usergroup.length > 0) {
            const modified_group_members = JSON.parse(
              usergroup[0]["_raw"].group_members
            );

            await database.write(async () => {
              await usergroup[0].update((group) => {
                group.group_members = [...modified_group_members, user];
              });
            });
          }

          if (usergroup.length > 0) {
            if (usergroup[0]["_raw"].type === "course") {
              const group_count = JSON.parse(usergroup[0]["_raw"].count);
              await database.write(async () => {
                await usergroup[0].update((group) => {
                  group.count = {
                    users: group_count.users + 1,
                  };
                });
              });

              setGroups((prevData) => {
                const newArray = prevData.map((group) => {
                  if (group.id === parseInt(group_id)) {
                    return {
                      ...group,
                      count: {
                        users: group.count.users + 1,
                      },
                    };
                  }
                  return group;
                });
                return newArray;
              });
            }
          }

          dispatch(
            handleUseffectActions.setRefreshDetailScreen({ reload: true })
          );
          dispatch(
            handleUseffectActions.setRefreshGroupMemberScreen({ reload: true })
          );
        }
      } catch (err) {
        console.log(err);
      }
    };

    const handleGroupLeave = async (msg) => {
      try {
        if (msg.user.username !== username) {
          const { group_id, user } = msg;

          const usergroup = await database
            .get("groups")
            .query(Q.where("group_id", parseInt(group_id)))
            .fetch();

          if (usergroup.length > 0) {
            let modified_group_members = JSON.parse(
              usergroup[0]["_raw"].group_members
            );
            modified_group_members = modified_group_members.filter((user_) => {
              if (user_.id !== user.id) {
                return user_;
              }
            });
            console.log("modified_group_members", modified_group_members);
            await database.write(async () => {
              await usergroup[0].update((group) => {
                group.group_members = modified_group_members;
              });
            });
          }

          if (usergroup.length > 0) {
            if (usergroup[0]["_raw"].type === "course") {
              const group_count = JSON.parse(usergroup[0]["_raw"].count);
              await database.write(async () => {
                await usergroup[0].update((group) => {
                  group.count = {
                    users: group_count.users - 1,
                  };
                });
              });

              setGroups((prevData) => {
                const newArray = prevData.map((group) => {
                  if (group.id === parseInt(group_id)) {
                    return {
                      ...group,
                      count: {
                        users: group.count.users - 1,
                      },
                    };
                  }
                  return group;
                });
                return newArray;
              });
            }
          }
          dispatch(
            handleUseffectActions.setRefreshDetailScreen({ reload: true })
          );
          dispatch(
            handleUseffectActions.setRefreshGroupMemberScreen({ reload: true })
          );
        }
      } catch (err) {
        console.log(err);
      }
    };

    const handleUserProfileChange = async (msg) => {
      try {
        const { profile_pic, user } = msg;

        const usergroups = await database.get("groups").query().fetch();

        const modify_profile_pic = async (group_id) => {
          const usergroup = await database
            .get("groups")
            .query(Q.where("group_id", group_id))
            .fetch();

          if (usergroup.length > 0) {
            const group_members = JSON.parse(
              usergroup[0]["_raw"].group_members
            );
            const userExists = group_members.some(
              (member) => member.id === user.id
            );

            if (userExists) {
              const modified_group_members = group_members.map((user_) => {
                if (user_.id === user.id) {
                  return {
                    ...user_,
                    image: profile_pic,
                  };
                }
                return user_;
              });

              await database.write(async () => {
                await usergroup[0].update((group) => {
                  group.group_members = [...modified_group_members];
                });
              });
            }
          }
        };

        if (usergroups.length > 0) {
          await Promise.all(
            usergroups.map((group) => {
              return modify_profile_pic(group["_raw"].group_id);
            })
          );
        }
        dispatch(
          handleUseffectActions.setRefreshDetailScreen({ reload: true })
        );
        dispatch(
          handleUseffectActions.setRefreshGroupMemberScreen({ reload: true })
        );
      } catch (err) {
        console.log(err);
      }
    };

    if (socket.current) {
      if (isConnected) {
        handleAddUser();
      }
      socket.current.on("disconnect", handleDisconnect);
      socket.current.on("message", handleMessage);
      socket.current.on("group-join", handleGroupJoin);
      socket.current.on("group-leave", handleGroupLeave);
      socket.current.on("profile-change", handleUserProfileChange);
    }

    return () => {
      if (socket.current) {
        socket.current.off("disconnect", handleDisconnect);
        socket.current.off("message", handleMessage);
        socket.current.off("group-join", handleGroupJoin);
        socket.current.off("group-leave", handleGroupLeave);
        socket.current.off("profile-change", handleUserProfileChange);
      }
    };
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) {
        navigation.navigate("Login");
      }
    }, [isLoggedIn])
  );

  const transformDataIntoRows = (data, itemsPerRow) => {
    const rows = [];
    for (let i = 0; i < data.length; i += itemsPerRow) {
      rows.push(data.slice(i, i + itemsPerRow));
    }
    return rows;
  };

  const getGroupsByUser = useCallback(async () => {
    try {
      setLoading(true);

      const usergroups = await database
        .get("groups")
        .query(Q.where("type", "course"))
        .fetch();

      if (usergroups.length > 0) {
        console.log("hey i am called course groups");
        const sanitized_docs = usergroups.map((group) => {
          const { group_id, count, createdAt, updatedAt, admins, ...rest } =
            group["_raw"];
          return {
            ...rest,
            count: count ? JSON.parse(count) : 0,
            id: group_id,
            admins: admins ? JSON.parse(admins) : [],
            createdAt: createdAt,
            updatedAt: updatedAt,
          };
        });
        setGroups(sanitized_docs);
      } else {
        const state = await NetInfo.fetch();

        if (!state.isConnected) {
          handleNetworkError("groups");
          return;
        }

        const response = await api.get(`${baseURL}/api/user/getGroupsByUser`);
        const sanitized_docs = response.data.message.map((group) => {
          const { id, _count, createdAt, updatedAt, admins, ...rest } = group;
          return {
            ...rest,
            count: _count,
            id: id,
            admins: admins,
            createdAt: createdAt,
            updatedAt: updatedAt,
          };
        });

        setGroups(sanitized_docs);

        const sanitized_docs_ = response.data.message.map((group) => {
          const { id, _count, admins, users, updatedAt, createdAt, ...rest } =
            group;
          return {
            ...rest,
            count: JSON.stringify(_count),
            admins: JSON.stringify(admins),
            group_id: id,
            createdAt: createdAt,
            updatedAt: updatedAt,
            group_members: JSON.stringify(users),
          };
        });

        await database.write(async () => {
          const groupsToDelete = await database
            .get("groups")
            .query(Q.where("type", "course"))
            .fetch();

          await database.batch(
            ...groupsToDelete.map((group) => group.prepareDestroyPermanently())
          );
        });

        await database.write(async () => {
          await database.batch(
            ...sanitized_docs_.map((group) =>
              database.get("groups").prepareCreate((record) => {
                Object.assign(record._raw, group);
              })
            )
          );
        });
      }
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("groups");
      } else {
        handleNetworkError("groups");
      }
    }
  }, [username]);

  useEffect(() => {
    if (refreshGroupsScreen || username) {
      getGroupsByUser();
      dispatch(handleUseffectActions.setRefreshGroupsScreen({ reload: false }));
    }
  }, [refreshGroupsScreen, username]);

  const getNonCourseGroupsByUser = useCallback(async () => {
    try {
      setNonCourseGroupsLoading(true);

      const usergroups = await database
        .get("groups")
        .query(Q.where("type", "non-course"))
        .fetch();

      if (usergroups.length > 0) {
        console.log("hey i am here non course");
        const sanitized_docs = usergroups.map((group) => {
          const { group_id, createdAt, updatedAt, admins, ...rest } =
            group["_raw"];
          return {
            ...rest,
            id: group_id,
            admins: admins ? JSON.parse(admins) : [],
            createdAt: createdAt,
            updatedAt: updatedAt,
          };
        });
        setNonCourseGroups(sanitized_docs);
      } else {
        const state = await NetInfo.fetch();

        if (!state.isConnected) {
          handleNetworkError("non-course-groups");
          return;
        }

        const response = await api.get(
          `${baseURL}/api/user/getNonCourseGroupsByUser`
        );

        const sanitized_docs = response.data.message.map((group) => {
          const { id, admins, createdAt, updatedAt, ...rest } = group;
          return {
            ...rest,
            id: id,
            admins: admins,
            createdAt: createdAt,
            updatedAt: updatedAt,
          };
        });

        setNonCourseGroups(sanitized_docs);

        const sanitized_docs_ = response.data.message.map((group) => {
          const { id, admins, updatedAt, createdAt, users, ...rest } = group;
          return {
            ...rest,
            admins: JSON.stringify(admins),
            group_id: id,
            createdAt: createdAt,
            updatedAt: updatedAt,
            group_members: JSON.stringify(users),
          };
        });

        await database.write(async () => {
          const groupsToDelete = await database
            .get("groups")
            .query(Q.where("type", "non-course"))
            .fetch();

          await database.batch(
            ...groupsToDelete.map((group) => group.prepareDestroyPermanently())
          );
        });

        await database.write(async () => {
          await database.batch(
            ...sanitized_docs_.map((group) =>
              database.get("groups").prepareCreate((record) => {
                Object.assign(record._raw, group);
              })
            )
          );
        });
      }
      setNonCourseGroupsLoading(false);
    } catch (err) {
      console.log(err);
      setNonCourseGroupsLoading(false);
      if (err.response.status === 503) {
        handleNetworkError("non-course-groups");
      } else {
        handleNetworkError("non-course-groups");
      }
    }
  }, [username]);

  useEffect(() => {
    if (refreshNonCourseGroups || username) {
      getNonCourseGroupsByUser();
      dispatch(
        handleUseffectActions.setRefreshNonCourseGroups({ reload: false })
      );
    }
  }, [refreshNonCourseGroups, username]);

  const itemsPerRow = 1;
  const rowData = transformDataIntoRows(groups, itemsPerRow);

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() =>
        navigation.navigate("ChatMessages", {
          id: item.id,
          username: username,
        })
      }
      key={item.id}
      // disabled={reloadMessages}
    >
      <ImageBackground
        source={{ uri: item.theme }}
        style={styles.image}
        key={reloadKey}
        imageStyle={styles.imageStyle}
        onLoadStart={() => {
          setLoadingImage((prevMap) => {
            const newMap = new Map(prevMap);
            newMap.set(`group-${item.id}`, true);
            return newMap;
          });
        }}
        onLoadEnd={() => {
          setTimeout(() => {
            setLoadingImage((prevMap) => {
              const newMap = new Map(prevMap);
              newMap.set(`group-${item.id}`, false);
              return newMap;
            });
          }, 5);
        }}
      >
        {loadingImage.get(`group-${item.id}`) === true && (
          <ActivityIndicator
            style={{ alignSelf: "center" }}
          ></ActivityIndicator>
        )}
        <Text style={styles.groupName}>
          {item.name
            .replace(/-/g, " ") // Replace hyphens with spaces
            .replace(/(\w+)\s(\w+)/, "$1\n$2")}
        </Text>
        <Text style={styles.members}>{item.count.users} members</Text>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderRow = ({ item }) => (
    <View style={styles.row}>
      {item.map((group) => renderGroupItem({ item: group }))}
    </View>
  );

  const retryfetch = () => {
    setnetworkLoad(false);
    networkErrorRef.current = false;
    if (fetchData.get("groups")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set("groups", false);
        return newMap;
      });
      getGroupsByUser();
    }

    if (fetchData.get("non-course-groups")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set("non-course-groups", false);
        return newMap;
      });
      getNonCourseGroupsByUser();
    }

    if (fetchData.get("update-messages")) {
      setfetchData((prevMap) => {
        const newMap = new Map(prevMap);
        newMap.set("update-messages", false);
        return newMap;
      });
      syncUserMessageswhenOffline();
    }
  };

  const renderPublicGroupItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        navigation.navigate("ChatMessages", {
          id: item.id,
          username: username,
        });
      }}
      // disabled={reloadMessages}
    >
      <View style={styles.publicGroupCard}>
        <View
          style={{
            position: "relative",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {loadingImage.get(`non-course-group-${item.id}`) === true && (
            <ActivityIndicator
              style={{ position: "absolute", zIndex: 1 }}
            ></ActivityIndicator>
          )}

          <Image
            source={{ uri: item.image }}
            onLoadStart={() => {
              setLoadingImage((prevMap) => {
                const newMap = new Map(prevMap);
                newMap.set(`non-course-group-${item.id}`, true);
                return newMap;
              });
            }}
            onLoadEnd={() => {
              setTimeout(() => {
                setLoadingImage((prevMap) => {
                  const newMap = new Map(prevMap);
                  newMap.set(`non-course-group-${item.id}`, false);
                  return newMap;
                });
              }, 5);
            }}
            style={{ width: 50, height: 50, borderRadius: 5 }}
          />
        </View>

        <View style={{ width: "80%" }}>
          <Text style={styles.publicGroupName}>{item.name}</Text>
          <Text
            style={styles.lastMessageText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.sender
              ? `${item.sender === username ? "you" : item.sender}: ${
                  item.recent_message
                }`
              : item.recent_message}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (networkLoad) {
    return (
      <View
        style={{
          ...styles.container,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          title="Refresh"
          onPress={() => {
            retryfetch();
          }}
        ></Button>
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <View style={styles.topContainer}>
          <Text style={styles.heading}>Groupchats</Text>
          <View style={styles.topContinerRight}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handlePress}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path d="M0 0h24v24H0z" fill="none"></Path>
              <Path fill="white" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></Path>
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              navigation.navigate("Groups");
            }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path d="M0 0h24v24H0z" fill="none" />
              <Path
                fill="white"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </Svg>
          </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.groupsListContainer}>
            <ActivityIndicator></ActivityIndicator>
          </View>
        ) : (
          <View style={styles.groupsListContainer}>
            <View
              style={{
                ...styles.titleBox,
                height: 30,
                marginBottom: 0,
                marginLeft: 10,
              }}
            >
              <Svg viewBox="0 0 24 24" width={20} height={20}>
                <Path d="M0 0h24v24H0V0z" fill="none"></Path>
                <Path
                  fill="white"
                  d="m19 1-5 5v11l5-4.5V1zM1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5V6c-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6zm22 13.5V6c-.6-.45-1.25-.75-2-1v13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5v2c1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5v-1.1z"
                ></Path>
              </Svg>

              <Text style={styles.titleText}>Courses</Text>
            </View>
            <FlatList
              data={rowData}
              renderItem={renderRow}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.groupsList}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {non_course_groups_loading ? (
          <View style={styles.groupsListContainer_2}>
            <ActivityIndicator></ActivityIndicator>
          </View>
        ) : (
          <View style={styles.groupsListContainer_2}>
            <View style={{ ...styles.titleBox, marginBottom: 20 }}>
              <Svg viewBox="0 0 24 24" width={20} height={20}>
                <Path fill="none" d="M0 0h24v24H0z" />

                <Path
                  fill="white"
                  d="M19.52 2.49C17.18.15 12.9.62 9.97 3.55c-1.6 1.6-2.52 3.87-2.54 5.46-.02 1.58.26 3.89-1.35 5.5l-4.24 4.24 1.42 1.42 4.24-4.24c1.61-1.61 3.92-1.33 5.5-1.35s3.86-.94 5.46-2.54c2.92-2.93 3.4-7.21 1.06-9.55zm-9.2 9.19c-1.53-1.53-1.05-4.61 1.06-6.72s5.18-2.59 6.72-1.06c1.53 1.53 1.05 4.61-1.06 6.72s-5.18 2.59-6.72 1.06zM18 17c.53 0 1.04.21 1.41.59.78.78.78 2.05 0 2.83-.37.37-.88.58-1.41.58s-1.04-.21-1.41-.59c-.78-.78-.78-2.05 0-2.83.37-.37.88-.58 1.41-.58m0-2a3.998 3.998 0 0 0-2.83 6.83c.78.78 1.81 1.17 2.83 1.17a3.998 3.998 0 0 0 2.83-6.83A3.998 3.998 0 0 0 18 15z"
                />
              </Svg>

              <Text style={styles.titleText}>Others</Text>
            </View>
            <FlatList
              data={non_course_groups}
              renderItem={renderPublicGroupItem}
              keyExtractor={(item) => item.id}
            />
          </View>
        )}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "flex-start",
    flexGrow: 1,
    paddingTop: screenHeight > 800 ? 80 : 10,
  },
  topContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: screenWidth * 0.9,
    height: 30,
    marginBottom: screenWidth * 0.1,
  },
  topContinerRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: screenWidth * 0.27,
    height: 30,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 10,
    display: "flex",
    flexDirection: "row",
    width: screenWidth * 0.95,
    height: screenWidth * 0.3,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  heading: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "Raleway",
    fontWeight: "bold",
  },
  bottomHeading: {
    color: "#c2c2c2",
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 700,
  },
  Button: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "white",
    backgroundColor: "black",
    marginBottom: 20,
  },
  innerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 30,
    fontFamily: "Raleway",
    fontWeight: "500",
    marginLeft: 10,
  },
  groupsListContainer: {
    alignItems: "left",
    height: 200,
    width: screenWidth * 0.9,
    marginTop: -20,
    backgroundColor: "#1c1c1c",
    borderRadius: 15,
    padding: 10,
    display: "flex",
  },
  groupsListContainer_2: {
    alignItems: "center",
    justifyContent: "center",
    maxHeight: screenHeight > 800 ? 370 : 250,
    minHeight: 250,
    width: screenWidth * 0.9,
    backgroundColor: "#1c1c1c",
    borderRadius: 15,
    padding: 10,
    marginTop: 30,
  },
  titleBox: {
    flexDirection: "row",
    width: screenWidth * 0.9,
    height: 30,
    alignItems: "center",
    marginBottom: 30,
    marginLeft: 40,
  },
  titleText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Red Hat Display",
    fontWeight: 700,
    marginLeft: 5,
  },
  groupsList: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 0,
  },
  groupName: {
    color: "white",
    fontSize: 16,
    width: "95%",
    fontFamily: "Poppins",
    fontWeight: "bold",
    textAlign: "left",
  },
  members: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: "500",
    lineHeight: 13,
    textAlign: "center",
    position: "absolute",
    bottom: 10,
    left: 10,
  },
  imageContainer: {
    width: screenWidth * 0.32,
    height: screenWidth * 0.32,
    borderRadius: 8,
    overflow: "hidden",
    marginHorizontal: 5,
    marginVertical: 12,
  },
  image: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "flex-start",
    padding: 10,
    alignItems: "left",
  },
  imageStyle: {
    borderRadius: 9,
  },
  createGroupButton: {
    width: 100,
    height: 30,
    padding: 8,
    borderWidth: 1,
    borderColor: "white",
    boxSizing: "border-box",
    borderRadius: 25,
    boxShadow: "0px 0px 10px rgba(3,3,3,0.1)",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: "500",
    outline: "none",
  },
  groupButton: {
    width: "80%",
    height: 30,
    borderRadius: 15,
    backgroundColor: "#232222",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    opacity: 0.95,
  },
  eventName: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Montserrat",
    fontWeight: "500",
    marginTop: 10,
  },
  eventItem: {
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "column",
  },
  detailsBox: {
    width: screenWidth * 0.44,
    flexDirection: "column",
    justifyContent: "flex-start",
    marginTop: -10,
  },
  eventTime: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "Montserrat",
    fontWeight: 700,
    lineHeight: 12,
    marginTop: 5,
  },
  publicGroupCard: {
    width: screenWidth * 0.8,
    height: "auto",
    borderRadius: 15,
    backgroundColor: "transparent",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  publicGroupName: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Inter",
    fontWeight: "500",
  },
  lastMessageText: {
    color: "#8a8a8a",
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: "500",
    marginTop: 5,
  },
  addButton: {
    backgroundColor: "#1f1f1f",
    width: 50,
    height: 50,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatsScreen;
