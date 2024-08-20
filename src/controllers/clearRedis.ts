import { redisClient } from "../config/redis";
import { Request, Response, NextFunction, RequestHandler } from "express";

export const clearRedis: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  await redisClient.flushdb();
  return res.status(200).json({ succuess: true, message: "Hello world" });
};
