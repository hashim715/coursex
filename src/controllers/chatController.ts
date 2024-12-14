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
  RemoveFromReversedGrouMap,
  RemoveFromReversedActiveUsersMap,
} from "../utils/chatFunctions";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { Message } from "../models/MessageSchema";
import { getTokenFunc } from "./usercontroller";
import jwt_decode from "jwt-decode";
import { getStreamingChatbotResponse } from "./knowledgebaseController";

dotenv.config();

type Messages = {
  sender: string;
  groupId: Number;
  message: string;
  type: string;
  timeStamp: string;
  status: Map<string, string>;
};

export const chatController = async (
  app: Application,
  server: http.Server
): Promise<void> => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    adapter: createAdapter(redispubsubClient),
  });

  io.on("connection", async (socket: Socket): Promise<void> => {
    let userDisconnectingTriggered = false;
    let leaveRoomTriggered = false;

    socket.on("join-room", async (data) => {
      if (data.groupID && data.username) {
        socket.join(data.groupID);
        await addSocketsToRoom(data.groupID, data.username, socket.id);
        console.log(`Room joined by ${data.username}`);
      }
    });

    socket.on("add-user", async (data) => {
      if (data.username) {
        await addActiveUsers(data.username, socket.id);
        console.log(`Added User ${data.username}`);
      }
    });

    socket.on("leave-room", async (data) => {
      leaveRoomTriggered = true;
      if (data.groupID && data.username) {
        socket.leave(data.groupID);
        await RemoveFromGroupRoomMap(data.groupID, data.username, socket.id);
      }
      leaveRoomTriggered = false;
    });

    socket.on("join-chatbot-room", async (data) => {
      if (data.groupID && data.username) {
        socket.join(data.groupID);
        await addSocketsToRoom(data.groupID, data.username, socket.id);
        console.log(`Chatbot Room joined by ${data.username}`);
      }
    });

    socket.on("leave-chatbot-room", async (data) => {
      leaveRoomTriggered = true;
      if (data.groupID && data.username) {
        socket.leave(data.groupID);
        await RemoveFromGroupRoomMap(data.groupID, data.username, socket.id);
      }
      leaveRoomTriggered = false;
    });

    socket.on("user-disconnecting", async (data) => {
      userDisconnectingTriggered = true;
      await RemoveFromActiveUsersMap(data.username, socket.id);
      console.log(`Removed User ${data.username}`);
      userDisconnectingTriggered = false;
    });

    socket.on("personal-chatbot-message", async (msg): Promise<void> => {
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

      io.to(parsedMessage.groupID).emit("personal-chatbot-message", {
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
          io.to(parsedMessage.groupID).emit("personal-chatbot-message", {
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
      if (parsedMessage.type === "text") {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
        });
      } else if (parsedMessage.type === "image") {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
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
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
          video: parsedMessage.video,
        });
      } else if (parsedMessage.type === "document") {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
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
      if (!leaveRoomTriggered) {
        await RemoveFromReversedGrouMap(socket.id);
      }
      if (!userDisconnectingTriggered) {
        await RemoveFromReversedActiveUsersMap(socket.id);
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
    })
      .sort({ timeStamp: -1 })
      .limit(50);

    const processedMessages = [];
    let imageGroup = null;

    for (const message of messages) {
      if (message.type === "image") {
        if (!imageGroup || imageGroup.timeStamp !== message.timeStamp) {
          if (imageGroup) {
            if (imageGroup.images.length > 3) {
              processedMessages.push(imageGroup);
            } else {
              processedMessages.push(
                ...imageGroup.images.map((img) => ({ ...img, grouped: false }))
              );
            }
          }

          imageGroup = {
            type: "image",
            images: [],
            grouped: true,
            timeStamp: message.timeStamp,
          };
        }

        imageGroup.images.push({
          sender: message.sender,
          groupId: message.groupID,
          message: message.message,
          timeStamp: message.timeStamp,
          type: message.type,
          image: message.image,
          status: message.status,
          error: false,
        });
      } else {
        if (imageGroup) {
          if (imageGroup.images.length > 3) {
            processedMessages.push(imageGroup);
          } else {
            processedMessages.push(
              ...imageGroup.images.map((img) => ({ ...img, grouped: false }))
            );
          }
          imageGroup = null;
        }
        processedMessages.push(message);
      }
    }

    if (imageGroup) {
      if (imageGroup.images.length > 3) {
        processedMessages.push(imageGroup);
      } else {
        processedMessages.push(
          ...imageGroup.images.map((img) => ({ ...img, grouped: false }))
        );
      }
    }

    return res
      .status(200)
      .json({ success: true, message: processedMessages.reverse() });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const updateDeliverStatusOnConnection: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    await Message.updateMany(
      {
        $or: [{ [`status.${username}`]: "sent" }],
      },
      {
        $set: {
          [`status.${username}`]: "delivered",
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
