import { Request, Response, NextFunction, RequestHandler } from "express";
import { getTokenFunc } from "../controllers/usercontroller";
import jwt_decode from "jwt-decode";
import { prisma } from "../config/postgres";
import crypto from "crypto";
import { client } from "../utils/sendEmail";

export const verifyEmail: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code }: { code: string } = req.body;

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const verification_token = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    if (user.verification_code !== verification_token) {
      return res
        .status(400)
        .json({ success: false, message: "Code did not match" });
    }

    if (Date.now() > new Date(user.verification_token_expiry).getTime()) {
      return res.status(400).json({
        success: false,
        message: "Your verification token is expired not valid",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const forgotPassword: RequestHandler = async () => {};

export const testSendingEmail: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await client.sendEmail({
      From: process.env.EMAIL_FROM,
      To: process.env.EMAIL_FROM,
      Subject: "Test",
      TextBody: "<h1>Hello from Postmark!</h1>",
    });
    return res.status(200).json({ success: true, message: "Email Sent" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};
