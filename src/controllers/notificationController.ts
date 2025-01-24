import { prisma } from "../config/postgres";
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt_decode from "jwt-decode";
import { firebase_admin } from "../config/firebase";
import { getTokenFunc } from "../utils/getTokenData";

export const refreshNotificationToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationToken } = req.body;

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { deviceToken: notificationToken },
    });

    return res
      .status(200)
      .json({ success: true, message: "Token refreshed successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const testNofication: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await firebase_admin.messaging().send({
      token:
        "cQVEzXT9jUNjqY1k6AHVJw:APA91bHlXxPNKDI-QoXLfcg40qpMOpa8XO0r2WjKuaYcIPeb1ZdmkqXLl1cADxh0iuiIyC9QeLLZVECCKYWOA-2DU3HjHBLJpmUV7TKHtKkF0cXi6hJfqfA",
      notification: {
        title: "CourseX",
        body: "Hello world this is coursex",
        imageUrl:
          "https://res.cloudinary.com/dicdsctqj/image/upload/v1734598815/kxnkkrd8y64ageulq5xb.jpg",
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Notification sent successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};
