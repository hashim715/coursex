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
import { Request, Response, NextFunction, RequestHandler } from "express";
import { Message } from "../models/MessageSchema";
import { getTokenFunc } from "./usercontroller";
import jwt_decode from "jwt-decode";
import { clearfiles } from "../utils/clearFiles";
import path from "path";
import fs, { renameSync } from "fs";
import { s3 } from "../config/aws_s3";
import cloudinary from "cloudinary";

dotenv.config();

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type Messages = {
  sender: string;
  groupId: Number;
  message: string;
  type: string;
  timeStamp: string;
  status: Map<string, string>;
};

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
      console.log(msg);
      await pubClient.publish(
        "MESSAGES",
        JSON.stringify({
          message: msg.message,
          groupID: msg.group_id,
          sender: msg.sender,
          id: socket.id,
          timeStamp: msg.timeStamp,
          type: msg.type,
          images: msg.images,
        })
      );
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

  subClient.on("message", async (channel, message) => {
    if (channel === "MESSAGES") {
      const parsedMessage = JSON.parse(message);
      if (parsedMessage.type === "text") {
        io.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: parsedMessage.id,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
        });
      } else {
        io.to(parsedMessage.groupID).emit("message", {
          message: parsedMessage.message,
          sender: parsedMessage.sender,
          id: parsedMessage.id,
          timeStamp: parsedMessage.timeStamp,
          type: parsedMessage.type,
          images: parsedMessage.images,
        });
      }
      await produceMessage(JSON.stringify(parsedMessage));
    }
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

export const uploadMessageImages: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const files_ = req.files as { [fieldname: string]: Express.Multer.File[] };
    const files: Express.Multer.File[] = files_["images"];

    const fileTypes = /jpeg|jpg|png|gif/;
    let filenames: Array<string> = [];
    let imageUrls: Array<string> = [];

    if (Array.isArray(files)) {
      if (files.length > 8) {
        clearfiles(files);
        return res.status(400).json({
          success: false,
          message: "Please upload upto 8 images only",
        });
      }

      for (const file of files) {
        const extname = fileTypes.test(
          path.extname(file.originalname).toLowerCase()
        );
        const mimetype = fileTypes.test(file.mimetype);

        if (!extname || !mimetype) {
          clearfiles(req.files);
          return res.status(400).json({
            success: false,
            message:
              "Invalid file format. Only JPEG, PNG, and GIF are allowed.",
          });
        }

        const date = Date.now();
        const filename = "uploads/userImages/" + date + file.originalname;
        renameSync(file.path, filename);
        //filenames.push(filename);

        const fileContent = fs.readFileSync(filename);

        const params = {
          Bucket: "w-groupchat-images",
          Key: `${Date.now()}_${file.originalname}`,
          Body: fileContent,
          ContentType: "image/jpeg",
        };

        try {
          // const s3Response = await s3.upload(params).promise();
          const result = await cloudinary.v2.uploader.upload(filename, {
            folder: "w-app-user-message-images",
          });
          //imageUrls.push(s3Response.Location);
          imageUrls.push(result.secure_url);
          fs.unlinkSync(filename);
        } catch (error) {
          clearfiles(req.files);
          return res.status(400).json({
            success: false,
            message: "Error while uploading images try again",
          });
        }
      }
    }

    return res.status(200).json({ success: true, message: imageUrls });
  } catch (err) {
    console.log(err);
    clearfiles(req.files);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};
