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
        "cDMnNpdP1ETbhHoMVxA8rA:APA91bFPm_2zGiRhkxs0mE2WoAbgEPlRDRJ629XlSLzVlxhKflSat2thHmmcghccoTvMh3NFaH_cB98McYMUJX6ihLaUUViIH3fTlQFuD85e3SNmD3yZHvk",
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
