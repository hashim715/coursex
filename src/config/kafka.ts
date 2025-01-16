import { Kafka, Partitioners } from "kafkajs";
import { Message } from "../models/MessageSchema";
import {
  ActiveUsersMapType,
  GroupMapType,
  DeserializeGroupMap,
  DeserializeActiveUsersMap,
} from "../utils/chatFunctions";
import { redisClient } from "./redisClient";
import { prisma } from "./postgres";
import dotenv from "dotenv";
import { firebase_admin } from "../config/firebase";

dotenv.config();

const get_active_users = async (usernames: Array<string>) => {
  try {
    const active_users_cache: string = await redisClient.get("active_users");
    let active_users: ActiveUsersMapType;
    const active_users_array: Array<string> = [];

    if (active_users_cache) {
      active_users = DeserializeActiveUsersMap(active_users_cache);
      if (active_users) {
        usernames.forEach((username) => {
          if (active_users.get(username)) {
            active_users_array.push(username);
          }
        });
      }
    }
    return active_users_array;
  } catch (err) {
    return [];
  }
};

const get_active_room_users = async (groupId: string) => {
  try {
    const room_users_cache: string = await redisClient.get("groups");
    let room_users: GroupMapType;
    let usernames: Array<string> = [];

    if (room_users_cache) {
      room_users = DeserializeGroupMap(room_users_cache);
      if (room_users) {
        if (room_users.get(groupId)) {
          room_users.get(groupId).forEach((value, key) => {
            usernames.push(key);
          });
        }
      }
    }
    return usernames;
  } catch (err) {
    return [];
  }
};

export const kafka = new Kafka({
  clientId: "my-app",
  brokers: [process.env.KAFKA_IP],
});

export const createTopic = async (): Promise<void> => {
  const admin = kafka.admin();
  try {
    await admin.connect();
    console.log("Admin connected");

    const existingTopics = await admin.listTopics();
    if (!existingTopics.includes("MESSAGES")) {
      await admin.createTopics({
        topics: [
          {
            topic: "MESSAGES",
            numPartitions: 2,
          },
        ],
      });
      console.log("Topic created: MESSAGES");
    } else {
      console.log("Topic already exists: MESSAGES");
    }
  } catch (err) {
    console.error("Error creating topic:", err);
  } finally {
    await admin.disconnect();
  }
};

export const produceMessage = async (message: string): Promise<void> => {
  const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
  });

  try {
    await producer.connect();
    console.log("Producer connected");

    await producer.send({
      messages: [{ key: `message-dev`, value: message }],
      topic: "MESSAGES",
    });
  } catch (err) {
    console.error("Error sending message:", err);
  } finally {
    await producer.disconnect();
  }
};

const saveMessageToDB = async (message: string) => {
  try {
    const parsedMessage = await JSON.parse(message);

    let active_room_users: Array<string>;

    active_room_users = await get_active_room_users(parsedMessage.groupID);

    const group_members = await prisma.group.findUnique({
      where: { id: parseInt(parsedMessage.groupID) },
      select: { users: true },
    });

    let active_users: Array<string> = [];

    type User = {
      id: number;
      username: string;
      name: string;
      email: string;
      college: string;
      year: string;
      image: string;
      courses: string;
      major: string;
      createdAt: Date;
      updatedAt: Date;
      token: string | null;
      verification_token: string | null;
      verification_token_expiry: string | null;
      verification_secret: string | null;
      isUserRegistered: boolean;
    };

    if (group_members) {
      group_members.users.forEach((user: User) => {
        if (!active_room_users.includes(user.username)) {
          active_users.push(user.username);
        }
      });
    }

    active_users = await get_active_users(active_users);

    const status = new Map<string, string>();

    active_room_users.forEach((username) => {
      if (username !== parsedMessage.sender) {
        status.set(username, "delivered");
      } else if (username === parsedMessage.sender) {
        status.set(username, "read");
      }
    });

    const non_active_users: Array<string> = [];

    if (group_members) {
      group_members.users.forEach((user: User) => {
        if (
          !active_room_users.includes(user.username) &&
          !active_users.includes(user.username)
        ) {
          status.set(user.username, "sent");
          non_active_users.push(user.username);
        }
      });
    }

    if (parsedMessage.type === "text") {
      const message_created = await Message.create({
        sender: parsedMessage.sender,
        groupId: parseInt(parsedMessage.groupID),
        message: parsedMessage.message,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
        status: status,
      });
    } else if (parsedMessage.type === "image") {
      const message_created = await Message.create({
        sender: parsedMessage.sender,
        groupId: parseInt(parsedMessage.groupID),
        message: parsedMessage.message,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
        image: parsedMessage.image,
        status: status,
      });
    } else if (parsedMessage.type === "video") {
      const message_created = await Message.create({
        sender: parsedMessage.sender,
        groupId: parseInt(parsedMessage.groupID),
        message: parsedMessage.message,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
        video: parsedMessage.video,
        status: status,
      });
    } else if (parsedMessage.type === "document") {
      const message_created = await Message.create({
        sender: parsedMessage.sender,
        groupId: parseInt(parsedMessage.groupID),
        message: parsedMessage.message,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
        document: parsedMessage.document,
        status: status,
        cover_image: parsedMessage.cover_image,
      });
    }

    await Promise.all(
      group_members.users.map((user: any) => {
        return sendNotification(user.username, parseInt(parsedMessage.groupID));
      })
    );
  } catch (err) {
    console.log(err);
  }
};

const sendNotification = async (username: string, group_id: number) => {
  try {
    const user = await prisma.user.findFirst({
      where: { username: username },
      select: {
        deviceToken: true,
      },
    });

    if (!user) {
      return;
    }

    const group = await prisma.group.findUnique({ where: { id: group_id } });

    if (!group) {
      return;
    }

    const messages = await Message.find({
      groupId: group.id,
      [`status.${username}`]: "sent",
      [`status.${username}`]: "delivered",
    }).sort({ timeStamp: -1 });

    if (messages.length > 0) {
      await firebase_admin.messaging().send({
        token: `${user.deviceToken}`,
        notification: {
          title: "CourseX",
          body: `You have recieved ${messages.length} messages from ${group.name}`,
          imageUrl:
            "https://res.cloudinary.com/dicdsctqj/image/upload/v1734598815/kxnkkrd8y64ageulq5xb.jpg",
        },
        apns: {
          headers: {
            "apns-collapse-id": `${group.id}`,
          },
        },
      });
    }
  } catch (err) {
    console.log(err);
  }
};

export const startMessageConsumer = async (): Promise<void> => {
  const consumer = kafka.consumer({ groupId: "0" });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: "MESSAGES", fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const parsedMessage = await JSON.parse(message.value.toString());
        await saveMessageToDB(JSON.stringify(parsedMessage));
        console.log(
          `Message from ${topic} partition ${partition} message is ${
            parsedMessage.type === "text"
              ? parsedMessage.message
              : parsedMessage.type
          }`
        );
      },
    });
  } catch (err) {
    console.error("Error starting message consumer:", err);
  }
};
