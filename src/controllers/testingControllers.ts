import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../config/postgres";

export const checkingNumberofMembersInGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // const groups = await prisma.group.findMany({
    //   where: {
    //     users: {
    //       none: {},
    //     },
    //   },
    //   orderBy: { createdAt: "desc" },
    // });

    // const groups = await prisma.group.findMany({
    //   include: {
    //     users: true, // Fetch users along with groups
    //   },
    //   orderBy: { createdAt: "desc" },
    // });

    // // Filter groups that have exactly one user
    // const filteredGroups = groups.filter((group) => group.users.length === 2);

    const assistants = await prisma.assistant.findMany({});

    return res.status(200).json({ success: true, assistants: assistants });
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
    const group = await prisma.group.findUnique({
      where: { id: 94 },
      include: { users: true },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const users = await prisma.user.findMany({});

    for (const user of users) {
      const filteredUser = group.users.filter(
        (user_: any) => user_.id === user.id
      );

      if (filteredUser.length > 0) {
        continue;
      }

      await prisma.group.update({
        where: { id: group.id },
        data: { users: { connect: { id: user.id } } },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { groups: { connect: { id: group.id } } },
      });
    }

    return res.status(200).json({ success: true, message: "Users added" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "You are not authorized user" });
    }
  }
};

export const verifyAllTheUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.user.updateMany({
      where: {},
      data: { isUserRegistered: true },
    });

    return res
      .status(200)
      .json({ success: true, message: "All the users updated" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "You are not authorized user" });
    }
  }
};
