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

export const testNofication: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await firebase_admin.messaging().send({
      token:
        "fIB4rr37JEsFloVzktV1Tr:APA91bFnFwxZpHUgRWX_82DSrTyasaCMljhJGPTf5e9GoswomEuF4Ws79pLn8HODTLyGKmi_9_8LUp_m4T61glCu-9pzkYWLDAkm6s8YjFl6xR819-UZelg",
      notification: {
        title: "CourseX",
        body: "this is a notification",
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
