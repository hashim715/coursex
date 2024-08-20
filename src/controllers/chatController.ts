import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import http from "http";
import { Application } from "express";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "../config/redis";
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

dotenv.config();

subClient.subscribe("MESSAGES", (err, count) => {
  if (err) {
    console.error("Failed to subscribe: ", err);
    return;
  }
});

export const chatController = async (
  app: Application,
  server: http.Server
): Promise<void> => {
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    adapter: createAdapter(pubClient, subClient),
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
      await pubClient.publish(
        "MESSAGES",
        JSON.stringify({
          message: msg.message,
          groupID: msg.group_id,
          username: msg.username,
          id: socket.id,
          timeStamp: msg.timeStamp,
          type: msg.type,
        })
      );
    });
    socket.on("disconnecting", async () => {
      console.log("disconnecting.....");
    });
    socket.on("disconnect", async () => {
      console.log("User disconnected");
      if (!leaveRoomTriggered) {
        await RemoveFromReversedGrouMap(socket.id);
      }
      if (!userDisconnectingTriggered) {
        await RemoveFromReversedActiveUsersMap(socket.id);
      }
    });
  });

  subClient.on("message", async (channel, message) => {
    if (channel === "MESSAGES") {
      const parsedMessage = JSON.parse(message);
      io.to(parsedMessage.groupID).emit("message", {
        message: parsedMessage.message,
        username: parsedMessage.username,
        id: parsedMessage.id,
        timeStamp: parsedMessage.timeStamp,
        type: parsedMessage.type,
      });
      await produceMessage(JSON.stringify(parsedMessage));
    }
  });
};

module.exports = { chatController };
