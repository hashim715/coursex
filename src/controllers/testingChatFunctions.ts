import { Request, Response, NextFunction, RequestHandler } from "express";
import {
  addSocketsToRoom,
  addActiveUsers,
  RemoveFromActiveUsersMap,
  RemoveFromGroupRoomMap,
  addToSocketsListForTrackingUsers,
  removeFromSocketsList,
} from "../utils/chatFunctions";

import { redisClient } from "../config/redisClient";

export const addToRoom: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const {
      groupID,
      username,
      socket_id,
    }: { groupID: string; username: string; socket_id: string } = req.body;
    await addSocketsToRoom(groupID, username, socket_id);
    return res
      .status(200)
      .json({ succuess: true, message: "Add User to Room" });
  } catch (err) {
    console.log("Some error occurred");
    console.log(err);
    return res
      .status(500)
      .json({ succuess: false, message: "Some server error" });
  }
};

export const addToActiveUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const { username, socket_id }: { username: string; socket_id: string } =
    req.body;
  await addActiveUsers(username, socket_id);
  return res
    .status(200)
    .json({ succuess: true, message: "Add User to Active Users" });
};

export const RemoveFromActiveUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const { username, socket_id }: { username: string; socket_id: string } =
    req.body;
  await RemoveFromActiveUsersMap(username, socket_id);
  return res
    .status(200)
    .json({ succuess: true, message: "Removed User From Active Users" });
};

export const getActiveUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const activeusers = await redisClient.get("active_users");
    if (activeusers) {
      return res
        .status(200)
        .json({ succcess: true, message: JSON.parse(activeusers) });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "NO active users" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ succuess: false, message: "Some server error" });
  }
};

export const RemoveFromGroupUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  const { groupID, username, socket_id } = req.body;
  await RemoveFromGroupRoomMap(groupID, username, socket_id);
  return res.status(200).json({
    succuess: true,
    message: "Removed User From Group Room Map Users",
  });
};

export const getGroupMapUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const activeusers = await redisClient.get("groups");
    if (activeusers) {
      return res
        .status(200)
        .json({ succcess: true, message: JSON.parse(activeusers) });
    } else {
      return res.status(404).json({ success: false, message: "NO room users" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ succuess: false, message: "Some server error" });
  }
};

export const addActiveSocksts: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { socket_id } = req.body;
    await addToSocketsListForTrackingUsers(socket_id);
    return res
      .status(200)
      .json({ success: true, message: "Added to Sockets List" });
  } catch (err) {
    return res
      .status(500)
      .json({ succuess: false, message: "Some server error" });
  }
};

export const RemoveFromSocketsList: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { socket_id } = req.body;
    await removeFromSocketsList(socket_id);
    return res
      .status(200)
      .json({ success: true, message: "Removed From Sockets List" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};

export const getSocketsList: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const socketsList = await redisClient.get("active-sockets-list");
    return res
      .status(200)
      .json({ success: true, message: JSON.parse(socketsList) });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};
