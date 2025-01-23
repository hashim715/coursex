import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../config/postgres";
import { getTokenFunc } from "../utils/getTokenData";
import jwt_decode from "jwt-decode";

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

export const joinExistingUsersToGroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const groupIds = [91, 94];

    let groups = await prisma.group.findMany({
      where: {
        id: {
          in: groupIds,
        },
      },
      include: { users: true },
    });

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    groups = groups.filter((group: any) => {
      const filteredUser = group.users.filter(
        (user_: any) => user_.id === user.id
      );

      if (filteredUser.length > 0) {
        return false;
      }
      return true;
    });

    const promises = groups.map((group: any) => {
      return async () => {
        await prisma.group.update({
          where: { id: group.id },
          data: { users: { connect: { id: user.id } } },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { groups: { connect: { id: group.id } } },
        });
      };
    });

    await Promise.all(promises);

    return res.status(200).json({ success: true, message: "User added" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "You are not authorized user" });
    }
  }
};
