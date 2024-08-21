import { Kafka, Partitioners } from "kafkajs";
import { Message } from "../models/MessageSchema";
import {
  ActiveUsersMapType,
  GroupMapType,
  DeserializeGroupMap,
  DeserializeActiveUsersMap,
} from "../utils/chatFunctions";
import { redisClient } from "../config/redis";
import { prisma } from "../config/postgres";

const get_active_users = async (usernames: Array<string>) => {
  try {
    const active_users_cache: string = await redisClient.get("active_users");
    let active_users: ActiveUsersMapType;

    if (active_users_cache) {
      active_users = DeserializeActiveUsersMap(active_users_cache);
    }
    const active_users_array: Array<string> = [];
    usernames.forEach((username) => {
      if (active_users.get(username)) {
        active_users_array.push(username);
      }
    });
    return active_users_array;
  } catch (err) {
    return null;
  }
};

const get_active_room_users = async (groupId: string) => {
  try {
    const room_users_cache: string = await redisClient.get("groups");
    let room_users: GroupMapType;

    if (room_users_cache) {
      room_users = DeserializeGroupMap(room_users_cache);
    }
    let usernames: Array<string> = [];
    room_users.get(groupId).forEach((value, key) => {
      usernames.push(key);
    });
    return usernames;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const kafka = new Kafka({
  clientId: "my-app",
  brokers: ["172.202.106.28:9092"],
});

export const createTopic = async (): Promise<void> => {
  const admin = kafka.admin();
  await admin.connect();
  console.log("Admin connected");

  await admin.createTopics({
    topics: [
      {
        topic: "MESSAGES",
        numPartitions: 4,
      },
    ],
  });
  console.log("Topic created messages");

  await admin.disconnect();
};

export const produceMessage = async (message: string): Promise<void> => {
  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });

  await producer.connect();
  console.log("Producer connected");

  await producer.send({
    messages: [{ key: `message-${Date.now()}`, value: message }],
    topic: "MESSAGES",
  });

  await producer.disconnect();
};

const saveMessageToDB = async (message: string) => {
  try {
    const parsedMessage = JSON.parse(message);

    const active_room_users = await get_active_room_users(
      parsedMessage.groupID
    );

    const group_members = await prisma.group.findUnique({
      where: { id: parseInt(parsedMessage.groupID) },
      select: { users: true },
    });

    let active_users: Array<string> = [];

    group_members.users.forEach((user) => {
      if (!active_room_users.includes(user.username)) {
        active_users.push(user.username);
      }
    });

    active_users = await get_active_users(active_users);

    const status = new Map<string, string>();

    active_room_users.forEach((username) => {
      status.set(username, "read");
    });

    active_users.forEach((username) => {
      status.set(username, "delivered");
    });

    group_members.users.forEach((user) => {
      if (
        !active_room_users.includes(user.username) &&
        !active_users.includes(user.username)
      ) {
        status.set(user.username, "sent");
      }
    });

    if (parsedMessage.type === "text") {
      const message_created = await Message.create({
        sender: parsedMessage.sender,
        groupId: parseInt(parsedMessage.groupID),
        message: parsedMessage.message,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
        status: status,
      });
    } else {
      const message_created = await Message.create({
        sender: parsedMessage.sender,
        groupId: parseInt(parsedMessage.groupID),
        message: parsedMessage.message,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
        images: parsedMessage.images,
        status: status,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const startMessageConsumer = async (): Promise<void> => {
  const consumer = kafka.consumer({ groupId: "0" });
  await consumer.connect();

  await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({
      topic,
      partition,
      message,
      heartbeat,
      pause,
    }): Promise<void> => {
      const parsedMessage = JSON.parse(message.value.toString());
      await saveMessageToDB(JSON.stringify(parsedMessage));
      console.log(
        `Message from ${topic} partition ${partition} message is ${
          parsedMessage.type === "text" ? parsedMessage.message : "Images"
        }`
      );
    },
  });
};
