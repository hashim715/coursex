import jwt from "jsonwebtoken";
import { prisma } from "../config/postgres";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import jwt_decode from "jwt-decode";

dotenv.config();

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "You are not authorized to access this route",
    });
  }

  try {
    const verify = jwt.verify(token, process.env.JWT_SECRET_REFRESH);
    const { username }: { username: string } = jwt_decode(token);
    const user = await prisma.user.findFirst({ where: { username: username } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "You are not authorized to access this route",
    });
  }
};
