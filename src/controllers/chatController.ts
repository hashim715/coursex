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
  addToSocketsListForTrackingUsers,
  removeFromSocketsList,
  RemoveFromReversedGrouMap,
  RemoveFromReversedActiveUsersMap,
} from "../utils/chatFunctions";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { Message } from "../models/MessageSchema";
import { getTokenFunc } from "./usercontroller";
import jwt_decode from "jwt-decode";

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
      socket.join(data.groupID);
      await addSocketsToRoom(data.groupID, data.username, socket.id);
      console.log(`Room joined by ${data.username}`);
    });
    socket.on("add-user", async (data) => {
      await addActiveUsers(data.username, socket.id);
      console.log(`Added User ${data.username}`);
    });
    socket.on("leave-room", async (data) => {
      leaveRoomTriggered = true;
      socket.leave(data.groupID);
      await RemoveFromGroupRoomMap(data.groupID, data.username, socket.id);
      console.log(`Room left ${data.username}`);
      leaveRoomTriggered = false;
    });
    socket.on("user-disconnecting", async (data) => {
      userDisconnectingTriggered = true;
      await RemoveFromActiveUsersMap(data.username, socket.id);
      console.log(`Removed User ${data.username}`);
      userDisconnectingTriggered = false;
    });
    socket.on("message", async (msg): Promise<void> => {
      const parsedMessage = {
        message: msg.message,
        groupID: msg.group_id,
        sender: msg.sender,
        id: socket.id,
        timeStamp: msg.timeStamp,
        type: msg.type,
        images: msg.images,
      };
      if (parsedMessage.type === "text") {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
        });
      } else {
        socket.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: socket.id,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
          images: parsedMessage.images,
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
      .limit(10);

    return res.status(200).json({ success: true, message: messages.reverse() });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};
