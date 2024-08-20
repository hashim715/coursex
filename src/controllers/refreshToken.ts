import { prisma } from "../config/postgres";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { sendToken } from "../utils/sendToken";

export const refreshToken: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { token }: { token: string } = req.body;
    const user = await prisma.user.findFirst({ where: { token: token } });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid refresh token" });
    }

    await sendToken(user.username, 200, res);
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "You are not authorized user" });
  }
};
