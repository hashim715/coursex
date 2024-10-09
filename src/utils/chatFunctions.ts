import { redisClient } from "../config/redisClient";

export type GroupMapType = Map<string, Map<string, SocketDataType1>>;

type SocketDataType1 = { username: string; socket_ids: Set<string> };
type SocketDataType2 = { username: string; socket_ids: Array<string> };

type UserDataType = [string, [string, SocketDataType2][]];

type UserNameType = [string, SocketDataType2][];

export type ActiveUsersMapType = Map<string, Set<string>>;

type ActiveUsers = [string, Array<string>];

type ReversedGroupMapType = Map<Map<SocketDataType1, string>, string>;

type ReversedMapType2 = Map<SocketDataType1, string>;

type ReverseActiveuserMapType = Map<Set<string>, string>;

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

// Convert Map to serializable array format
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

// Deserialize JSON data
export const DeserializeGroupMap = (data: string): GroupMapType => {
  const entries = JSON.parse(data);

  if (entries) {
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
  } else {
    return null;
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
  } finally {
    unlock();
  }
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
  } finally {
    unlock();
  }
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
  } finally {
    unlock();
  }
};

const reversedMap = (map: GroupMapType): ReversedGroupMapType => {
  const reversedMap: ReversedGroupMapType = new Map(
    Array.from(map.entries()).map(([key, value]) => {
      const reversedMap2: ReversedMapType2 = new Map(
        Array.from(value.entries()).map(([key, value]) => [value, key])
      );
      return [reversedMap2, key];
    })
  );
  return reversedMap;
};

type returnType = {
  groupID: string | undefined | null;
  username: string | undefined | null;
};

type returnType2 = { username: string | undefined | null };

const getKeysFromReversedGrouMap = (
  socket_id: string,
  map: ReversedGroupMapType
): returnType => {
  let keys: returnType = { groupID: null, username: null };
  for (const [group_key, group_value] of map) {
    for (const [key, value] of group_key) {
      if (key.socket_ids.has(socket_id)) {
        keys.username = value;
        keys.groupID = group_value;
        return keys;
      }
    }
  }
  return keys;
};

export const RemoveFromReversedGrouMap = async (
  socket_id: string
): Promise<void> => {
  const unlock = await mutex.lock();

  try {
    const cachedData: string = await redisClient.get(`groups`);
    if (cachedData) {
      const usersockets: GroupMapType = DeserializeGroupMap(cachedData);
      const reversedGroupMap: ReversedGroupMapType = reversedMap(usersockets);
      const { groupID, username }: returnType = getKeysFromReversedGrouMap(
        socket_id,
        reversedGroupMap
      );
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
              console.log("Left the room due to disconnection....");
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
  } finally {
    unlock();
  }
};

export const addToSocketsListForTrackingUsers = async (
  socket_id: string
): Promise<void> => {
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
};

const CheckForUserInActiveSocketsList = async (
  socket_id: string
): Promise<boolean> => {
  const cachedData: string = await redisClient.get("active-sockets-list");
  if (cachedData) {
    const parsed: Array<string> = await JSON.parse(cachedData);
    const activesockets: Set<string> = new Set(parsed);
    if (activesockets.has(socket_id)) {
      return true;
    }
  }
  return false;
};

const reverseActiveUserMaps = (
  map: ActiveUsersMapType
): ReverseActiveuserMapType => {
  const reversedMap: ReverseActiveuserMapType = new Map(
    Array.from(map.entries()).map(([key, value]) => [value, key])
  );
  return reversedMap;
};

const getKeysFromActiveUsersMap = (
  map: ReverseActiveuserMapType,
  socket_id: string
) => {
  const keys: returnType2 = { username: null };
  for (const [key, value] of map) {
    if (key.has(socket_id)) {
      keys.username = value;
      return keys;
    }
  }
  return keys;
};

export const removeFromSocketsList = async (socket_id: string) => {
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
};

const asyncFunction = async () => {
  const unlock = await mutex.lock();

  try {
    // Critical section
    // Perform your asynchronous operations here
    // Example: await someAsyncOperation();
  } finally {
    unlock();
  }
};

export const RemoveFromReversedActiveUsersMap = async (socket_id: string) => {
  const unlock = await mutex.lock();

  try {
    const cachedData: string = await redisClient.get(`active_users`);
    if (cachedData) {
      const activeusers: ActiveUsersMapType =
        DeserializeActiveUsersMap(cachedData);
      const reversedActiveSockets: ReverseActiveuserMapType =
        reverseActiveUserMaps(activeusers);
      const { username }: returnType2 = getKeysFromActiveUsersMap(
        reversedActiveSockets,
        socket_id
      );
      if (activeusers.has(username)) {
        if (activeusers.get(username).size > 0) {
          if (activeusers.get(username).has(socket_id)) {
            activeusers.get(username).delete(socket_id);
            console.log("Removed the user during disconnection....");
            if (activeusers.get(username).size === 0) {
              activeusers.delete(username);
            }
            await redisClient.setEx(
              `active_users`,
              1800,
              JSON.stringify(SerializeActiveUsersMap(activeusers))
            );
          }
        }
      }
    }
  } finally {
    unlock();
  }
};
