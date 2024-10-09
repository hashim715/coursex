import { prisma } from "../config/postgres";
import { Request, Response, NextFunction, RequestHandler } from "express";
import bcrypt from "bcrypt";
import { sendToken } from "../utils/sendToken";
import { validateEmail } from "../utils/checkvalidemail";
import { matchPassword } from "../utils/matchPassword";
import jwt_decode from "jwt-decode";
import { clearfiles } from "../utils/clearFiles";
import path from "path";
import { renameSync } from "fs";
import fs from "fs";
import { s3 } from "../config/aws_s3";
import { deleteImageByUrl } from "../utils/deleteimagefroms3";
import { shuffleItems } from "../utils/shuffleItem";
import { mergeItems } from "../utils/mergeItems";
import QRCode from "qrcode";
import { redisClient } from "../config/redisClient";
import { Group, Group2, Event, Album, User2 } from "../utils/dataTypes";

export const getTokenFunc = (req: Request) => {
  let token: string;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  return token;
};

export const register: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const {
      name,
      username,
      email,
    }: {
      name: string;
      username: string;
      email: string;
    } = req.body;

    let { password }: { password: string } = req.body;

    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    if (username.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Username should be of 6 characters at least",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password should be of 8 characters at least",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email address that you provided is not valid",
      });
    }

    let user = await prisma.user.findFirst({
      where: { username: username },
    });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User with that username already exists",
      });
    }

    user = await prisma.user.findFirst({ where: { email: email } });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User with that email already exists",
      });
    }

    const salt: string = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

    user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: password,
        name: name,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const login: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { email, password }: { email: string; password: string } = req.body;
    if (!email.trim() || !password.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }
    const user = await prisma.user.findFirst({ where: { email: email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with that email does not exists",
      });
    }

    if (!user.isUserVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Your account is not verified" });
    }

    const isMatch = await matchPassword(password, user.password);
    if (!isMatch) {
      return res
        .status(404)
        .json({ success: false, message: "Password did not match" });
    }
    await sendToken(user.username, 200, res);
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const createGroup: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { name, college, description, image } = req.body;

    if (!name.trim() || !college.trim() || !description.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let group;
    if (image) {
      group = await prisma.group.create({
        data: {
          name: name,
          college: college,
          description: description,
          admins: [user.id],
          image: image,
        },
      });
    } else {
      group = await prisma.group.create({
        data: {
          name: name,
          college: college,
          description: description,
          admins: [user.id],
        },
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { groups: { connect: { id: group.id } } },
    });

    await prisma.group.update({
      where: { id: group.id },
      data: { users: { connect: { id: user.id } } },
    });

    const groups: string = await redisClient.get("groups");

    const group_members = await prisma.group.findUnique({
      where: { id: group.id },
      select: { users: true },
    });

    const group_data = {
      id: group.id,
      name: group.name,
      image: group.image,
      admins: group.admins,
      college: group.college,
      description: group.description,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      _count: { users: group_members.users.length },
    };

    if (groups) {
      const groups_: Array<Group2> = JSON.parse(groups);

      groups_.unshift(group_data);

      await redisClient.setEx("groups", 1800, JSON.stringify(groups_));
    }

    const recent_groups: string = await redisClient.get("recent-groups");

    if (recent_groups) {
      const groups_: Array<Group2> = JSON.parse(recent_groups);

      groups_.unshift(group_data);

      await redisClient.setEx("recent-groups", 1800, JSON.stringify(groups_));
    }

    const user_groups: string = await redisClient.get(
      `${user.username}-groups`
    );

    if (user_groups) {
      const _groups: Array<Group> = JSON.parse(user_groups);

      const group_data = {
        id: group.id,
        name: group.name,
        image: group.image,
        admins: group.admins,
        college: group.college,
        description: group.description,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };

      _groups.unshift(group_data);

      await redisClient.setEx(
        `${user.username}-groups`,
        1800,
        JSON.stringify(_groups)
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Group created successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getGroupsByUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const groups: string = await redisClient.get(`${user.name}-groups`);

    if (groups) {
      const groups_: Array<Group> = JSON.parse(groups);

      return res.status(200).json({ success: true, message: groups_ });
    } else {
      const groups = await prisma.user.findUnique({
        where: { id: user.id },
        select: { groups: { orderBy: { createdAt: "desc" } } },
      });

      await redisClient.setEx(
        `${user.username}-groups`,
        1800,
        JSON.stringify(groups.groups)
      );

      return res.status(200).json({ success: true, message: groups.groups });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getGroupDetails: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { group_id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: parseInt(group_id) },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group with the id does not exists" });
    }

    const group_members = await prisma.group.findUnique({
      where: { id: group.id },
      select: { users: true },
    });

    return res
      .status(200)
      .json({ success: true, group: group, members: group_members });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getGroupsByColleges: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { college_name } = req.params;

    const groups = await prisma.group.findMany({
      where: { college: college_name },
    });

    if (!groups) {
      return res.status(404).json({
        success: false,
        message: "Groups with this college names does not exists",
      });
    }

    return res.status(200).json({ success: true, groups: groups });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const groups: string = await redisClient.get(`groups`);

    if (groups) {
      const groups_: Array<Group2> = JSON.parse(groups);

      return res.status(200).json({ success: true, message: groups_ });
    } else {
      const groups = await prisma.group.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      await redisClient.setEx("groups", 1800, JSON.stringify(groups));

      return res.status(200).json({ success: true, message: groups });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const joinGroups: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { group_id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: parseInt(group_id) },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group with given id does not exists",
      });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    await prisma.group.update({
      where: { id: group.id },
      data: { users: { connect: { id: user.id } } },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { groups: { connect: { id: group.id } } },
    });

    const groups: string = await redisClient.get("groups");

    if (groups) {
      const groups_: Array<Group2> = JSON.parse(groups);

      const group_element: Group2 = groups_.find(
        (element) => element.id === group.id
      );

      if (group_element) {
        const index = groups_.indexOf(group_element);
        group_element._count.users = group_element._count.users + 1;
        groups_[index] = group_element;
      }

      await redisClient.setEx("groups", 1800, JSON.stringify(groups_));
    }

    const recent_groups: string = await redisClient.get("recent-groups");

    if (recent_groups) {
      const groups_: Array<Group2> = JSON.parse(recent_groups);

      const group_element: Group2 = groups_.find(
        (element) => element.id === group.id
      );

      if (group_element) {
        const index = groups_.indexOf(group_element);
        group_element._count.users = group_element._count.users + 1;
        groups_[index] = group_element;
      }

      await redisClient.setEx("recent-groups", 1800, JSON.stringify(groups_));
    }

    const user_groups: string = await redisClient.get(
      `${user.username}-groups`
    );

    if (user_groups) {
      const _groups: Array<Group> = JSON.parse(user_groups);

      const group_data = {
        id: group.id,
        name: group.name,
        image: group.image,
        admins: group.admins,
        college: group.college,
        description: group.description,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };

      _groups.unshift(group_data);

      await redisClient.setEx(
        `${user.username}-groups`,
        1800,
        JSON.stringify(_groups)
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "User joined successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const isUserintheGroup: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { group_id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: parseInt(group_id) },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group with id does not exists" });
    }

    const group_members = await prisma.group.findUnique({
      where: { id: group.id },
      select: { users: true },
    });

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    let isUser = false;

    for (const _user of group_members.users) {
      if (_user.id === user.id) {
        isUser = true;
      }
    }

    if (isUser) {
      return res.status(200).json({ success: true, user: true });
    } else {
      return res.status(200).json({ success: true, user: false });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getUserInfo: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const groups = await prisma.user.findUnique({
      where: { id: user.id },
      select: { groups: true },
    });

    const albums = await prisma.album.findMany({ where: { user_id: user.id } });

    const totalGroups = groups.groups.length;

    return res.status(200).json({
      success: true,
      message: user,
      totalGroups: totalGroups,
      albums: albums,
    });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const editProfileInfo: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const {
      name,
      college,
      courses,
      year,
      major,
      fraternity,
      relationship_status,
      theme,
      profile_image,
      cover_image,
      theme_color,
      clubs,
    }: {
      name: string;
      college: string;
      courses: string;
      year: string;
      major: string;
      fraternity: string;
      relationship_status: string;
      theme: string;
      profile_image: string;
      cover_image: string;
      theme_color: string;
      clubs: string;
    } = req.body;

    if (
      !name.trim() ||
      !college.trim() ||
      !courses.trim() ||
      !year.trim() ||
      !major.trim() ||
      !fraternity.trim() ||
      !relationship_status.trim() ||
      !theme.trim() ||
      !profile_image.trim() ||
      !cover_image.trim() ||
      !theme_color.trim() ||
      !clubs.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name,
        courses: courses,
        college: college,
        year: year,
        major: major,
        relationship_status: relationship_status,
        theme: theme,
        image: profile_image,
        cover_image: cover_image,
        fraternity: fraternity,
        theme_color: theme_color,
        clubs: clubs,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "User profile updated successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getGroupJoinUrl: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { group_id } = req.params;

    const url = `exp://192.168.10.9:8081/--/group/${group_id}`;

    return res.status(200).redirect(url);
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const generateQrCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { group_id } = req.params;

    const url = `exp://192.168.10.9:8081/--/group/${group_id}`;

    let fileContent;
    let imageUrl;

    let qrurl = QRCode.toFile("qrcodes/qrcode.jpeg", url, async (err) => {
      if (err) {
        console.error(err);
        return res
          .status(400)
          .json({ success: false, message: "Error while generating qr code" });
      } else {
        console.log("QR code saved as qrcode.jpeg");
        fileContent = fs.readFileSync("qrcodes/qrcode.jpeg");
        const params = {
          Bucket: "w-groupchat-images",
          Key: `${Date.now()}_qrcode.jpeg`,
          Body: fileContent,
          ContentType: "image/jpeg",
        };
        const s3Response = await s3.upload(params).promise();
        imageUrl = s3Response.Location;

        fs.unlinkSync("qrcodes/qrcode.jpeg");

        return res.status(200).json({ success: true, message: imageUrl });
      }
    });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getUserInfoById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const groups = await prisma.user.findUnique({
      where: { id: user.id },
      select: { groups: true },
    });

    const albums = await prisma.album.findMany({ where: { user_id: user.id } });

    const totalGroups = groups.groups.length;

    return res.status(200).json({
      success: true,
      message: user,
      groups: groups,
      totalGroups: totalGroups,
      albums: albums,
    });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const leavethegroup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { group_id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: parseInt(group_id) },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group with given id does not exists",
      });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    await prisma.group.update({
      where: { id: group.id },
      data: { users: { disconnect: { id: user.id } } },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { groups: { disconnect: { id: group.id } } },
    });

    const groups: string = await redisClient.get("groups");

    if (groups) {
      let groups_: Array<Group2> = JSON.parse(groups);

      groups_ = groups_.filter((element) => element.id !== group.id);

      await redisClient.setEx("groups", 1800, JSON.stringify(groups_));
    }

    const user_groups: string = await redisClient.get(
      `${user.username}-groups`
    );

    if (user_groups) {
      let _groups: Array<Group> = JSON.parse(user_groups);

      _groups = _groups.filter((element) => element.id !== group.id);

      await redisClient.setEx(
        `${user.username}-groups`,
        1800,
        JSON.stringify(_groups)
      );
    }

    return res
      .status(200)
      .json({ success: false, message: "You left the group" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const createEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      location,
      description,
      startTime,
      endTime,
      image,
    }: {
      name: string;
      location: string;
      description: string;
      startTime: string;
      endTime: string;
      image: string;
    } = req.body;

    if (
      !name.trim() ||
      !location.trim() ||
      !description.trim() ||
      !startTime.trim() ||
      !endTime.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill out the form correctly",
      });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    let event;

    if (image) {
      event = await prisma.event.create({
        data: {
          name: name,
          adminId: user.id,
          location: location,
          description: description,
          startTime: startTime,
          endTime: endTime,
          image: image,
        },
      });
    } else {
      event = await prisma.event.create({
        data: {
          name: name,
          adminId: user.id,
          location: location,
          description: description,
          startTime: startTime,
          endTime: endTime,
        },
      });
    }

    const events: string = await redisClient.get("events");
    const recent_events: string = await redisClient.get("recent-events");
    const user_events: string = await redisClient.get(`events-${username}`);

    if (events) {
      const events_: Array<Event> = JSON.parse(events);

      events_.unshift(event);

      await redisClient.setEx("events", 1800, JSON.stringify(events_));
    }

    if (recent_events) {
      const recent_events_: Array<Event> = JSON.parse(recent_events);

      recent_events_.unshift(event);

      await redisClient.setEx(
        "recent-events",
        1800,
        JSON.stringify(recent_events_)
      );
    }

    if (user_events) {
      const user_events_: Array<Event> = JSON.parse(user_events);

      user_events_.unshift(event);

      await redisClient.setEx(
        `events-${username}`,
        1800,
        JSON.stringify(user_events_)
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Your event creatd successfully." });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events: string = await redisClient.get("events");

    if (events) {
      const events_: Array<Event> = JSON.parse(events);

      return res.status(200).json({ success: true, message: events_ });
    } else {
      const events = await prisma.event.findMany({
        orderBy: { createdAt: "desc" },
      });

      await redisClient.setEx("events", 1800, JSON.stringify(events));

      return res.status(200).json({ success: true, message: events });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const getEventDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { event_id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(event_id) },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event with given id does not exists",
      });
    }

    return res.status(200).json({ success: true, message: event });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const testingController: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    return res.status(200).json({ success: true, message: "Good...." });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Server error occurred" });
    }
  }
};

export const createJobs: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      qualifications,
      form,
      link,
      postingDate,
      schedule,
      department,
      college,
    }: {
      name: string;
      description: string;
      qualifications: string;
      form: string;
      link: string;
      postingDate: string;
      schedule: string;
      department: string;
      college: string;
    } = req.body;

    if (
      !name.trim() ||
      !description.trim() ||
      !qualifications.trim() ||
      !form.trim() ||
      !link.trim() ||
      !postingDate.trim() ||
      !schedule.trim() ||
      !department.trim() ||
      !college.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    await prisma.job.create({
      data: {
        name: name,
        description: description,
        qualifications: qualifications,
        form: form,
        link: link,
        postingDate: postingDate,
        schedule: schedule,
        department: department,
        college: college,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Jobs created successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getJobs: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const jobs = await prisma.job.findMany({});

    return res.status(200).json({ success: true, message: jobs });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getJobDetails: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { job_id } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: parseInt(job_id) },
    });

    if (!job) {
      return res
        .status(404)
        .json({ success: false, message: "Job with gived id does not exists" });
    }

    return res.status(200).json({ success: true, message: job });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const createAlbum: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      theme_name,
      album_title,
      album_description,
      album_cover,
      album_photos,
    }: {
      theme_name: string;
      album_title: string;
      album_description: string;
      album_cover: string;
      album_photos: string;
    } = req.body;

    if (
      !theme_name.trim() ||
      !album_title.trim() ||
      !album_description.trim() ||
      !album_cover.trim() ||
      !album_photos.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const album_photos_: Array<string> = JSON.parse(album_photos);

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    const album = await prisma.album.create({
      data: {
        name: album_title,
        description: album_description,
        theme_name: theme_name,
        album_cover: album_cover,
        album_photos: album_photos_,
        user_id: user.id,
      },
    });

    const albums: string = await redisClient.get(`albums-${user.username}`);
    const recent_albums: string = await redisClient.get("recent-albums");

    if (albums) {
      const albums_: Array<Album> = JSON.parse(albums);

      albums_.unshift(album);

      await redisClient.setEx(
        `albums-${user.username}`,
        1800,
        JSON.stringify(albums_)
      );
    }

    if (recent_albums) {
      const recent_albums_: Array<Album> = JSON.parse(recent_albums);

      recent_albums_.unshift(album);

      await redisClient.setEx(
        "recent-albums",
        1800,
        JSON.stringify(recent_albums_)
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Your album created successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getAlbumns: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    const albums: string = await redisClient.get(`albums-${user.username}`);

    if (albums) {
      const albums_: Array<Album> = JSON.parse(albums);

      return res.status(200).json({ success: true, message: albums_ });
    } else {
      const albums = await prisma.album.findMany({
        where: { user_id: user.id },
        orderBy: { createdAt: "desc" },
      });

      await redisClient.setEx(
        `albums-${user.username}`,
        1800,
        JSON.stringify(albums)
      );

      return res.status(200).json({ success: true, message: albums });
    }
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getSingleAlbum: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { album_id } = req.params;

    const album_id_ = parseInt(album_id);

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    const album = await prisma.album.findUnique({ where: { id: album_id_ } });

    return res.status(200).json({ success: true, message: album });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getRecentEvents: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const now = new Date();

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events: string = await redisClient.get("recent-events");

    if (events) {
      const events_: Array<Event> = JSON.parse(events);

      return res.status(200).json({ success: true, message: events_ });
    } else {
      const events = await prisma.event.findMany({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      await redisClient.setEx("recent-events", 1800, JSON.stringify(events));

      return res.status(200).json({ success: true, message: events });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getRecentGroups: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const now = new Date();

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const groups: string = await redisClient.get("recent-groups");

    if (groups) {
      const groups_: Array<Group2> = JSON.parse(groups);

      return res.status(200).json({ success: true, message: groups_ });
    } else {
      const groups = await prisma.group.findMany({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      await redisClient.setEx("recent-groups", 1800, JSON.stringify(groups));

      return res.status(200).json({ success: true, message: groups });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getRecentAlbums: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const now = new Date();

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const albums: string = await redisClient.get("recent-albums");

    if (albums) {
      const albums_: Array<Album> = JSON.parse(albums);

      return res.status(200).json({ success: true, message: albums_ });
    } else {
      const albums = await prisma.album.findMany({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      await redisClient.setEx("recent-albums", 1800, JSON.stringify(albums));

      return res.status(200).json({ success: true, message: albums });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getEventsByUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    const events: string = await redisClient.get(`events-${user.username}`);

    if (events) {
      const events_: Array<Event> = JSON.parse(events);

      return res.status(200).json({ success: true, message: events_ });
    } else {
      const events = await prisma.event.findMany({
        where: { adminId: user.id },
        orderBy: { createdAt: "desc" },
      });

      await redisClient.setEx(
        `events-${user.username}`,
        1800,
        JSON.stringify(events)
      );

      return res.status(200).json({ success: true, message: events });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getRecentUsers: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const now = new Date();

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const users = await redisClient.get("recent-users");

    if (users) {
      const users_: Array<User2> = JSON.parse(users);

      return res.status(200).json({ success: true, message: users_ });
    } else {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        where: { createdAt: { gte: twentyFourHoursAgo } },
      });

      await redisClient.setEx("recent-users", 1800, JSON.stringify(users));

      return res.status(200).json({ success: true, message: users });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getMixedEventsAndAlbums: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const now = new Date();

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recent_events: string = await redisClient.get("recent-events");
    let events_: Array<Event>;

    if (recent_events) {
      events_ = JSON.parse(recent_events);
    } else {
      events_ = await prisma.event.findMany({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      await redisClient.setEx("recent-events", 1800, JSON.stringify(events_));
    }

    const recent_albums: string = await redisClient.get("recent-albums");
    let albums_: Array<Album>;

    if (recent_albums) {
      albums_ = JSON.parse(recent_albums);
    } else {
      albums_ = await prisma.album.findMany({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      await redisClient.setEx("recent-albums", 1800, JSON.stringify(albums_));
    }

    const mergedData: Array<Event | Album> = mergeItems(events_, albums_);

    const shuffledData: Array<Event | Album> = shuffleItems(mergedData);

    return res.status(200).json({ success: true, message: shuffledData });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};
