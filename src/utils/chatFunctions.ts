import { redisClient } from "../config/redisClient";

export type GroupMapType = Map<string, Map<string, SocketDataType1>>;

type SocketDataType1 = { username: string; socket_ids: Set<string> };
type SocketDataType2 = { username: string; socket_ids: Array<string> };

type UserDataType = [string, [string, SocketDataType2][]];

export type ActiveUsersMapType = Map<string, Set<string>>;

type ActiveUsers = [string, Array<string>];

type SavedUsersMapType = Map<string, string>;

type SavedUsers = Array<[string, string]>;

class Mutex {
  private mutex = Promise.resolve();

  lock(): PromiseLike<() => void> {
    let begin: (unlock: () => void) => void = (unlock) => {};

    this.mutex = this.mutex.then(() => new Promise(begin));

    return new Promise((res) => {
      begin = res;
    });
  }
}

const mutex = new Mutex();

const serializeGroupMap = (map: GroupMapType): UserDataType[] => {
  return Array.from(map.entries()).map(
    ([groupID, userMap]: [string, Map<string, SocketDataType1>]) => {
      return [
        groupID,
        Array.from(userMap.entries()).map(([key, value]) => {
          return [
            key,
            {
              username: value.username,
              socket_ids: Array.from(value.socket_ids),
            },
          ];
        }),
      ];
    }
  );
};

export const DeserializeGroupMap = (data: string): GroupMapType => {
  const entries = JSON.parse(data);

  const groups: GroupMapType = new Map(
    entries.map(([groupID, userArray]: UserDataType) => [
      groupID,
      new Map(
        userArray.map(([username, socketData]) => [
          username,
          {
            username: socketData.username,
            socket_ids: new Set<string>(socketData.socket_ids),
          },
        ])
      ),
    ])
  );
  return groups;
};

const SerializeActiveUsersMap = (
  usersmap: ActiveUsersMapType
): ActiveUsers[] => {
  return Array.from(usersmap.entries()).map(([key, value]) => [
    key,
    Array.from(value),
  ]);
};

export const DeserializeActiveUsersMap = (data: string): ActiveUsersMapType => {
  let parsedUsers: ActiveUsers = JSON.parse(data);
  let activeusers: ActiveUsersMapType = new Map(
    parsedUsers.map(([key, value]) => [key, new Set(value)])
  );
  return activeusers;
};

export const SerializeSocketConnectionMap = (
  map: SavedUsersMapType
): SavedUsers => {
  return Array.from(map);
};

export const DeSerializeSocketConnectionMap = (
  data: string
): SavedUsersMapType => {
  const parsedArray: SavedUsers = JSON.parse(data);
  return new Map(parsedArray);
};

export const addSocketsToRoom = async (
  groupID: string,
  username: string,
  socket_id: string
): Promise<void> => {
  const unlock = await mutex.lock();
  try {
    const cachedData: string = await redisClient.get(`groups`);
    if (cachedData) {
      const usersockets: GroupMapType = DeserializeGroupMap(cachedData);
      if (usersockets.has(groupID)) {
        if (usersockets.get(groupID).has(username)) {
          usersockets.get(groupID).get(username).socket_ids.add(socket_id);
        } else {
          usersockets.get(groupID).set(username, {
            username: username,
            socket_ids: new Set<string>([socket_id]),
          });
        }
      } else {
        usersockets.set(
          groupID,
          new Map<string, SocketDataType1>([
            [
              username,
              { username: username, socket_ids: new Set<string>([socket_id]) },
            ],
          ])
        );
      }
      await redisClient.setEx(
        `groups`,
        1800,
        JSON.stringify(serializeGroupMap(usersockets))
      );
    } else {
      const usersockets: GroupMapType = new Map([
        [
          groupID,
          new Map<string, SocketDataType1>([
            [
              username,
              { username: username, socket_ids: new Set<string>([socket_id]) },
            ],
          ]),
        ],
      ]);
      await redisClient.setEx(
        `groups`,
        1800,
        JSON.stringify(serializeGroupMap(usersockets))
      );
    }
  } catch (err) {
    console.log(err);
  } finally {
    unlock();
  }
};

export const addActiveUsers = async (
  username: string,
  socket_id: string
): Promise<void> => {
  const unlock = await mutex.lock();

  try {
    const cachedData: string = await redisClient.get(`active_users`);
    if (cachedData) {
      const activeusers: ActiveUsersMapType =
        DeserializeActiveUsersMap(cachedData);
      if (activeusers.has(username)) {
        activeusers.get(username).add(socket_id);
      } else {
        activeusers.set(username, new Set<string>([socket_id]));
      }
      await redisClient.setEx(
        `active_users`,
        1800,
        JSON.stringify(SerializeActiveUsersMap(activeusers))
      );
    } else {
      const activeusers: ActiveUsersMapType = new Map([
        [username, new Set<string>([socket_id])],
      ]);
      await redisClient.setEx(
        `active_users`,
        1800,
        JSON.stringify(SerializeActiveUsersMap(activeusers))
      );
    }
  } catch (err) {
    console.log(err);
  } finally {
    unlock();
  }
};

export const addToSocketsListForTrackingUsers = async (
  socket_id: string
): Promise<void> => {
  try {
    const cachedData: string = await redisClient.get("active-sockets-list");
    if (cachedData) {
      const parsed: Array<string> = await JSON.parse(cachedData);
      const activesockets: Set<string> = new Set(parsed);
      if (activesockets.has(socket_id)) {
        return;
      } else {
        activesockets.add(socket_id);
      }
      await redisClient.setEx(
        "active-sockets-list",
        1800,
        JSON.stringify(Array.from(activesockets))
      );
    } else {
      await redisClient.setEx(
        "active-sockets-list",
        1800,
        JSON.stringify(Array.from(new Set([socket_id])))
      );
    }
  } catch (err) {
    console.log(err);
  } finally {
  }
};

export const saveUserSocketToRedis = async (
  socket_id: string,
  username: string
) => {
  const unlock = await mutex.lock();
  try {
    const cachedData: string = await redisClient.get(`user_sockets_data`);
    if (cachedData) {
      const usersMap: SavedUsersMapType =
        DeSerializeSocketConnectionMap(cachedData);
      usersMap.set(socket_id, username);
      await redisClient.setEx(
        "user_sockets_data",
        1800,
        JSON.stringify(SerializeSocketConnectionMap(usersMap))
      );
    } else {
      await redisClient.setEx(
        "user_sockets_data",
        1800,
        JSON.stringify(Array.from(new Map([[socket_id, username]])))
      );
    }
  } catch (err) {
    console.log(err);
  } finally {
    unlock();
  }
};

export const getusernameFromSocketId = async (socket_id: string) => {
  const unlock = await mutex.lock();
  try {
    const cachedData: string = await redisClient.get(`user_sockets_data`);
    if (cachedData) {
      const usersMap: SavedUsersMapType =
        DeSerializeSocketConnectionMap(cachedData);
      return usersMap.get(socket_id);
    } else {
      return null;
    }
  } catch (err) {
    console.log(err);
    return null;
  } finally {
    unlock();
  }
};

export const removeFromSocketsList = async (socket_id: string) => {
  try {
    const cachedData = await redisClient.get("active-sockets-list");
    if (cachedData) {
      const parsed: Array<string> = await JSON.parse(cachedData);
      const activesockets: Set<string> = new Set(parsed);
      if (activesockets.has(socket_id)) {
        activesockets.delete(socket_id);
        console.log("Removed the user from sockets list....");
      }
      await redisClient.setEx(
        "active-sockets-list",
        1800,
        JSON.stringify(Array.from(activesockets))
      );
    }
  } catch (err) {
    console.log(err);
  } finally {
  }
};

export const RemoveFromGroupRoomMap = async (
  groupID: string,
  username: string,
  socket_id: string
): Promise<void> => {
  const unlock = await mutex.lock();
  try {
    const cachedData: string = await redisClient.get(`groups`);
    if (cachedData) {
      const usersockets: GroupMapType = DeserializeGroupMap(cachedData);
      if (usersockets.has(groupID)) {
        if (usersockets.get(groupID).has(username)) {
          if (usersockets.get(groupID).get(username).socket_ids.size > 0) {
            if (
              usersockets.get(groupID).get(username).socket_ids.has(socket_id)
            ) {
              usersockets
                .get(groupID)
                .get(username)
                .socket_ids.delete(socket_id);
              console.log(`chat room left ${username}`);
              if (
                usersockets.get(groupID).get(username).socket_ids.size === 0
              ) {
                usersockets.get(groupID).delete(username);
                if (usersockets.get(groupID).size === 0) {
                  usersockets.delete(groupID);
                }
              }
            }
          }
        }
      }
      await redisClient.setEx(
        `groups`,
        1800,
        JSON.stringify(serializeGroupMap(usersockets))
      );
    }
  } catch (err) {
    console.log(err);
  } finally {
    unlock();
  }
};

export const RemoveFromActiveUsersMap = async (
  username: string,
  socket_id: string
): Promise<void> => {
  const unlock = await mutex.lock();

  try {
    const cachedData: string = await redisClient.get(`active_users`);
    if (cachedData) {
      const activeusers: ActiveUsersMapType =
        DeserializeActiveUsersMap(cachedData);
      if (activeusers.has(username)) {
        if (activeusers.get(username).size > 0) {
          if (activeusers.get(username).has(socket_id)) {
            activeusers.get(username).delete(socket_id);
            console.log(`removed user ${username}`);
            if (activeusers.get(username).size === 0) {
              activeusers.delete(username);
            }
          }
        }
      }
      await redisClient.setEx(
        `active_users`,
        1800,
        JSON.stringify(SerializeActiveUsersMap(activeusers))
      );
    }
  } catch (err) {
    console.log(err);
  } finally {
    unlock();
  }
};
