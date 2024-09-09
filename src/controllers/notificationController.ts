import { prisma } from "../config/postgres";
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt_decode from "jwt-decode";
import { firebase_admin } from "../config/firebase";

export const getRegistrationToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { registration_token } = req.body;
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};
