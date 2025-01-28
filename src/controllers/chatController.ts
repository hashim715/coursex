import dotenv from "dotenv";
import { Server, Socket } from "socket.io";
import http from "http";
import { Application } from "express";
import { createAdapter } from "@socket.io/redis-streams-adapter";
import { redispubsubClient } from "../config/redis";
import { produceMessage } from "../config/kafka";
import {
  addSocketsToRoom,
  addActiveUsers,
  RemoveFromActiveUsersMap,
  RemoveFromGroupRoomMap,
  saveUserSocketToRedis,
  getusernameFromSocketId,
} from "../utils/chatFunctions";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { Message } from "../models/MessageSchema";
import { getTokenFunc } from "../utils/getTokenData";
import jwt_decode from "jwt-decode";
import { getStreamingChatbotResponse } from "./knowledgebaseController";
import {
  chatWithGeminiFunction,
  searchTheWebFunction,
  chatWithDocumentFunction,
} from "./aiController";
import { prisma } from "../config/postgres";

dotenv.config();

type Messages = {
  sender: string;
  groupId: Number;
  message: string;
  type: string;
  timeStamp: string;
  status: Map<string, string>;
};

export let io: Server | null = null;

export const chatController = async (
  app: Application,
  server: http.Server
): Promise<void> => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    adapter: createAdapter(redispubsubClient),
  });

  io.on("connection", async (socket: Socket): Promise<void> => {
    socket.on("join-room", async (data) => {
      if (data.username) {
        await joinRoom(data.username, socket);
      }
    });

    socket.on("join-single-room", async (data) => {
      if (data.username && data.group_id) {
        const groupID = data.group_id.toString();
        socket.join(groupID);
        await addSocketsToRoom(groupID, data.username, socket.id);
        console.log(`join single room by ${data.username}`);
      }
    });

    socket.on("leave-single-room", async (data) => {
      if (data.username && data.group_id) {
        const groupID = data.group_id.toString();
        socket.leave(groupID);
        await RemoveFromGroupRoomMap(groupID, data.username, socket.id);
        console.log(`left single room by ${data.username}`);
      }
    });

    socket.on("add-user", async (data) => {
      if (data.username) {
        await addActiveUsers(data.username, socket.id);
        await saveUserSocketToRedis(socket.id, data.username);
        console.log(`Added User ${data.username}`);
      }
    });

    socket.on("join-chatbot-room", async (data) => {
      if (data.groupID && data.username) {
        socket.join(data.groupID);
        console.log(`Chatbot Room joined by ${data.username}`);
      }
    });

    socket.on("leave-chatbot-room", async (data) => {
      if (data.groupID && data.username) {
        socket.leave(data.groupID);
        console.log(`chatbot room left ${data.username}`);
      }
    });

    socket.on("personal-chatbot-message", async (msg): Promise<void> => {
      const parsedMessage = {
        message: msg.message,
        groupID: msg.group_id,
        sender: msg.sender,
        id: socket.id,
        timeStamp: msg.timeStamp,
        type: msg.type,
        taskType: msg.taskType,
        message_id: msg.message_id,
        previousChat: msg.previousChat,
        document_url: msg.document_url,
        chat_history: msg.chat_history,
      };

      io.to(parsedMessage.groupID).emit("personal-chatbot-message", {
        message: "Chatbot is typing...",
        sender: "Sage",
        id: socket.id,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
        message_id: parsedMessage.message_id + 1,
        isFinal: false,
        taskType: parsedMessage.taskType,
      });

      if (parsedMessage.taskType === "webChat") {
        await searchTheWebFunction(
          parsedMessage.message,
          parsedMessage.chat_history,
          (chunk: string, isFinal: Boolean) => {
            io.to(parsedMessage.groupID).emit("personal-chatbot-message", {
              message: chunk,
              sender: "Sage",
              id: socket.id,
              timeStamp: parsedMessage.timeStamp,
              type: parsedMessage.type,
              message_id: parsedMessage.message_id + 1,
              taskType: parsedMessage.taskType,
              isFinal: isFinal,
            });
          }
        );
      } else if (parsedMessage.taskType === "documentChat") {
        await chatWithDocumentFunction(
          parsedMessage.message,
          parsedMessage.document_url,
          (chunk: string, isFinal: Boolean) => {
            io.to(parsedMessage.groupID).emit("personal-chatbot-message", {
              message: chunk,
              sender: "Sage",
              id: socket.id,
              timeStamp: parsedMessage.timeStamp,
              type: parsedMessage.type,
              message_id: parsedMessage.message_id + 1,
              taskType: parsedMessage.taskType,
              isFinal: isFinal,
            });
          }
        );
      } else if (parsedMessage.taskType === "geminiChat") {
        await chatWithGeminiFunction(
          parsedMessage.message,
          "none",
          parsedMessage.previousChat,
          (chunk: string, isFinal: Boolean) => {
            io.to(parsedMessage.groupID).emit("personal-chatbot-message", {
              message: chunk,
              sender: "Sage",
              id: socket.id,
              timeStamp: parsedMessage.timeStamp,
              type: parsedMessage.type,
              message_id: parsedMessage.message_id + 1,
              taskType: parsedMessage.taskType,
              isFinal: isFinal,
            });
          }
        );
      }
    });

    socket.on("group-chatbot-message", async (msg): Promise<void> => {
      const parsedMessage = {
        message: msg.message,
        groupID: msg.group_id,
        sender: msg.sender,
        id: socket.id,
        timeStamp: msg.timeStamp,
        type: msg.type,
        message_id: msg.message_id,
        assistant_name: msg.assistant_name,
      };

      io.to(parsedMessage.groupID).emit("group-chatbot-message", {
        message: "Chatbot is typing...",
        sender: parsedMessage.assistant_name,
        id: socket.id,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
        message_id: parsedMessage.message_id + 1,
        isFinal: false,
        assistant_name: parsedMessage.assistant_name,
      });

      await getStreamingChatbotResponse(
        parsedMessage.message,
        "none",
        "none",
        parsedMessage.assistant_name,
        (chunk: string, isFinal: Boolean) => {
          io.to(parsedMessage.groupID).emit("group-chatbot-message", {
            message: chunk,
            sender: parsedMessage.assistant_name,
            id: socket.id,
            timeStamp: parsedMessage.timeStamp,
            type: parsedMessage.type,
            message_id: parsedMessage.message_id + 1,
            isFinal: isFinal,
            assistant_name: parsedMessage.assistant_name,
          });
        }
      );
    });

    socket.on("message", async (msg): Promise<void> => {
      const parsedMessage = {
        message: msg.message,
        groupID: msg.group_id,
        sender: msg.sender,
        id: socket.id,
        timeStamp: msg.timeStamp,
        type: msg.type,
        image: msg.image,
        document: msg.document,
        video: msg.video,
        cover_image: msg.cover_image,
      };

      parsedMessage.groupID = msg.group_id.toString();

      if (parsedMessage.type === "text") {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
          group_id: parsedMessage.groupID,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
        });
      } else if (parsedMessage.type === "image") {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
          group_id: parsedMessage.groupID,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
          image: parsedMessage.image,
          grouped: false,
          error: false,
        });
      } else if (parsedMessage.type === "video") {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
          group_id: parsedMessage.groupID,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
          video: parsedMessage.video,
        });
      } else if (parsedMessage.type === "document") {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
          group_id: parsedMessage.groupID,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
          document: parsedMessage.document,
          cover_image: parsedMessage.cover_image,
        });
      }
      await produceMessage(JSON.stringify(parsedMessage));
    });

    socket.on("disconnecting", async () => {
      console.log("disconnecting.....");
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected " + socket.id);
      const username: string | null = await getusernameFromSocketId(socket.id);
      if (username) {
        await leaveRoom(username, socket);
        await removeUser(username, socket.id);
      }
    });
  });
};

export const getMessagesByGroup: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { group_id } = req.params;

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    await Message.updateMany(
      {
        groupId: parseInt(group_id),
        $or: [
          { [`status.${username}`]: "sent" },
          { [`status.${username}`]: "delivered" },
        ],
      },
      {
        $set: {
          [`status.${username}`]: "read",
        },
      }
    );

    const messages = await Message.find({
      groupId: parseInt(group_id),
    }).sort({ timeStamp: -1 });

    return res.status(200).json({ success: true, message: messages.reverse() });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const updateReadStatusOnConnection: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { group_id } = req.params;

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    await Message.updateMany(
      {
        groupId: parseInt(group_id),
        $or: [
          { [`status.${username}`]: "sent" },
          { [`status.${username}`]: "delivered" },
        ],
      },
      {
        $set: {
          [`status.${username}`]: "read",
        },
      }
    );

    return res
      .status(200)
      .json({ success: true, message: "Messages Updated successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const syncUserMetadataForAllGroups: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const groups = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        groups: {
          orderBy: { createdAt: "desc" },
          include: {
            users: true,
            _count: {
              select: {
                users: true,
              },
            },
          },
        },
      },
    });

    const groupIds = groups.groups.map((group: any) => group.id);

    const unreadCount = await Message.aggregate([
      {
        $match: {
          groupId: { $in: groupIds },
          $or: [
            { [`status.${username}`]: "sent" },
            { [`status.${username}`]: "delivered" },
          ],
        },
      },
      {
        $group: {
          _id: "$groupId",
          unreadCount: { $sum: 1 },
        },
      },
    ]);

    const recentMessages = await Message.aggregate([
      {
        $match: {
          groupId: { $in: groupIds },
        },
      },
      {
        $sort: { timeStamp: -1 },
      },
      {
        $group: {
          _id: "$groupId",
          recentMessage: { $first: "$$ROOT" },
        },
      },
    ]);

    const combinedMetadata = [];

    for (const group of groups.groups) {
      const unreadCountData = unreadCount.find(
        (meta) => meta._id === group.id
      ) || {
        unreadCount: 0,
      };

      const recentMessage = recentMessages.find(
        (recent_message) => recent_message._id === group.id
      ) || {
        recentMessage: "No messages",
        sender: "",
      };

      const user_ = await prisma.user.findFirst({
        where: { username: recentMessage.sender },
      });

      if (user_) {
        combinedMetadata.push({
          group: group,
          unreadCount: unreadCountData.unreadCount,
          recentMessage: recentMessage.recentMessage,
          sender: user_.name,
        });
      } else {
        combinedMetadata.push({
          group: group,
          unreadCount: unreadCountData.unreadCount,
          recentMessage: recentMessage.recentMessage,
          sender: "",
        });
      }
    }

    const sortedMetadata = combinedMetadata.sort((a: any, b: any) => {
      const timeA = a.recentMessage?.timeStamp || 0;
      const timeB = b.recentMessage?.timeStamp || 0;
      return timeB - timeA;
    });

    await Message.updateMany(
      {
        groupId: { $in: groupIds },
        $or: [{ [`status.${username}`]: "sent" }],
      },
      {
        $set: {
          [`status.${username}`]: "delivered",
        },
      }
    );

    return res.status(200).json({ success: true, message: sortedMetadata });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const syncUserMessagesForaSingleGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { group_id } = req.params;

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const messages = await Message.find({
      groupId: parseInt(group_id),
      $or: [
        { [`status.${username}`]: "sent" },
        { [`status.${username}`]: "delivered" },
      ],
    }).sort({ timeStamp: -1 });

    await Message.updateMany(
      {
        groupId: parseInt(group_id),
        $or: [
          { [`status.${username}`]: "sent" },
          { [`status.${username}`]: "delivered" },
        ],
      },
      {
        $set: {
          [`status.${username}`]: "read",
        },
      }
    );

    return res.status(200).json({ success: true, message: messages });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

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

const joinRoom = async (username: string, socket: Socket) => {
  const unlock = await mutex.lock();
  try {
    const user = await prisma.user.findFirst({ where: { username: username } });

    const result = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        groups: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const groups = result.groups;

    for (const group of groups) {
      const groupID = group.id.toString();
      socket.join(groupID);
      console.log(`Room joined by ${username}`);
      await addSocketsToRoom(groupID, username, socket.id);
    }
  } catch (err) {
    console.log(err);
  } finally {
    unlock();
  }
};

const leaveRoom = async (username: string, socket: Socket) => {
  const unlock = await mutex.lock();
  try {
    const user = await prisma.user.findFirst({ where: { username: username } });

    const result = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        groups: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const groups = result.groups;
    for (const group of groups) {
      const groupID = group.id.toString();
      socket.leave(groupID);
      await RemoveFromGroupRoomMap(groupID, username, socket.id);
    }
  } catch (err) {
    console.log(err);
  } finally {
    unlock();
  }
};

const removeUser = async (username: string, socket_id: string) => {
  const unlock = await mutex.lock();
  try {
    await RemoveFromActiveUsersMap(username, socket_id);
  } catch (err) {
    console.log(err);
  } finally {
    unlock();
  }
};
