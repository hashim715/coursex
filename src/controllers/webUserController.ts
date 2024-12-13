import { Request, Response, NextFunction, RequestHandler } from "express";
import { User } from "../models/UserSchema";
import { validateEmail } from "../utils/checkvalidemail";

export const createUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, schoolName }: { email: string; schoolName: string } =
      req.body;

    if (!email.trim() || !schoolName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email address that you provided is not valid",
      });
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const user = await User.create({ email: email, schoolName: schoolName });

    return res
      .status(201)
      .json({ success: true, message: "Registered successfully" });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};
