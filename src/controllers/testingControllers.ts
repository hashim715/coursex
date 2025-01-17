import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../config/postgres";

export const checkingNumberofMembersInGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const groups = await prisma.group.findMany({
      where: {
        users: {
          none: {},
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, groups: groups });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "You are not authorized user" });
    }
  }
};
