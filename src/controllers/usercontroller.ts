import { prisma } from "../config/postgres";
import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt_decode from "jwt-decode";
import fs from "fs";
import { s3 } from "../config/aws_s3";
import QRCode from "qrcode";
import { redisClient } from "../config/redisClient";
import { Group2, User2 } from "../utils/dataTypes";
import { Message } from "../models/MessageSchema";
import { generateVerificationCode } from "../utils/getVerificationCode";
import { email_transporter } from "../utils/sendEmail";
import { createAssistant } from "../controllers/knowledgebaseController";
import { io } from "./chatController";
import { validatePhoneNumber } from "../utils/validatePhoneNumber";
import { validateEmail } from "../utils/checkvalidemail";
import { v4 as uuidv4 } from "uuid";
import { getTokenFunc } from "../utils/getTokenData";

export const registerWithPhone: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const {
      phone_number,
    }: {
      phone_number: string;
    } = req.body;

    if (!phone_number.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    if (!validatePhoneNumber(phone_number)) {
      return res.status(400).json({
        success: false,
        message: "Phone number that you provided is not valid",
      });
    }

    const user = await prisma.user.findFirst({
      where: { phone_number: phone_number },
    });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User with that phone number already exists",
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

    const { verificationToken, token, code } = generateVerificationCode();

    const currentDate = new Date();
    const next30Minutes = new Date(currentDate.getTime() + 30 * 60 * 1000); // 30 minutes from currentDate

    await prisma.user.update({
      where: { email: email },
      data: {
        verification_secret: token,
        verification_token: verificationToken,
        verification_token_expiry: next30Minutes.toISOString(),
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Hello from CourseX",
      text: "Verify your Email",
      html: `<h1>Your verification code is: ${code}</h1></br><p>Click on the link given below:<a>https://coursex.us/app/verification/${email}/verify</a></p>`,
    };

    await email_transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: "Verification code sent successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const registerWithEmail: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      email,
    }: {
      name: string;
      email: string;
    } = req.body;

    if (!name.trim() || !email.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email that you provided is not valid",
      });
    }

    let user = await prisma.user.findFirst({
      where: { email: email },
    });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User with that email already exists",
      });
    }

    const uuid = uuidv4();

    const username = `${name.trim()}-${uuid}`;

    user = await prisma.user.findFirst({ where: { username: username } });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "Try again something went wrong",
      });
    }

    const { verificationToken, token, code } = generateVerificationCode();

    const currentDate = new Date();
    const next30Minutes = new Date(currentDate.getTime() + 30 * 60 * 1000);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Hello from CourseX",
      text: "Verify your Email",
      html: `<h1>Your verification code is: ${code}</h1></br><p>Click on the link given below:<a>https://coursex.us/app/verification/${email}/verify</a></p>`,
    };

    await email_transporter.sendMail(mailOptions);

    user = await prisma.user.create({
      data: {
        username: username,
        name: name,
        email: email,
        verification_secret: token,
        verification_token: verificationToken,
        verification_token_expiry: next30Minutes.toISOString(),
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

export const redirectUserToVerification: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, screen } = req.params;

    const url = `exp://192.168.100.16:8081/--/verification/${email}/${screen}`;

    return res.status(200).redirect(url);
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const createGroup: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const {
      name,
      college,
      description,
      image,
      type,
      theme,
      assistantInstruction,
    } = req.body;

    if (
      !name.trim() ||
      !college.trim() ||
      !description.trim() ||
      !type.trim() ||
      !assistantInstruction.trim()
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

    const prefix = Date.now();
    const uniqueAssistantName = `${prefix}-assistant`;

    const assistantData = await createAssistant(
      uniqueAssistantName,
      assistantInstruction
    );

    if (assistantData.error) {
      return res.status(400).json({
        success: false,
        message: assistantData.message,
      });
    }

    const group = await prisma.group.create({
      data: {
        name: name,
        college: college,
        description: description,
        admins: [user.id],
        type: type,
        theme: theme,
      },
    });

    await prisma.assistant.create({
      data: {
        name: "Sam AI",
        instructions: assistantData.instructions,
        group_id: group.id,
        chatbotName: uniqueAssistantName,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { groups: { connect: { id: group.id } } },
    });

    await prisma.group.update({
      where: { id: group.id },
      data: { users: { connect: { id: user.id } } },
    });

    const groups: string = await redisClient.get("total_client_groups");

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

    if (groups && group.type === "non-course") {
      const groups_: Array<Group2> = JSON.parse(groups);

      groups_.unshift(group_data);

      await redisClient.setEx(
        "total_client_groups",
        1800,
        JSON.stringify(groups_)
      );
    }

    const recent_groups: string = await redisClient.get("recent-groups");

    if (recent_groups && group.type === "non-course") {
      const groups_: Array<Group2> = JSON.parse(recent_groups);

      groups_.unshift(group_data);

      await redisClient.setEx("recent-groups", 1800, JSON.stringify(groups_));
    }

    let group_created = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        users: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Group created successfully",
      group: group_created,
    });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const createNonCourseGroup: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { name, college, description, image, type, theme } = req.body;

    if (
      !name.trim() ||
      !college.trim() ||
      !description.trim() ||
      !type.trim()
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

    const group = await prisma.group.create({
      data: {
        name: name,
        college: college,
        description: description,
        admins: [user.id],
        image: image,
        type: type,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { groups: { connect: { id: group.id } } },
    });

    await prisma.group.update({
      where: { id: group.id },
      data: { users: { connect: { id: user.id } } },
    });

    const groups: string = await redisClient.get("total_client_groups");

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

    if (groups && group.type === "non-course") {
      const groups_: Array<Group2> = JSON.parse(groups);

      groups_.unshift(group_data);

      await redisClient.setEx(
        "total_client_groups",
        1800,
        JSON.stringify(groups_)
      );
    }

    const recent_groups: string = await redisClient.get("recent-groups");

    if (recent_groups && group.type === "non-course") {
      const groups_: Array<Group2> = JSON.parse(recent_groups);

      groups_.unshift(group_data);

      await redisClient.setEx("recent-groups", 1800, JSON.stringify(groups_));
    }

    let group_created = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        users: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    const group_info = {
      id: group_created.id,
      name: group_created.name,
      image: group_created.image,
      admins: group_created.admins,
      college: group_created.college,
      description: group_created.description,
      createdAt: group_created.createdAt,
      updatedAt: group_created.updatedAt,
      recent_message: "No messages",
      theme: group_created.theme,
      type: group_created.type,
      sender: null as string | null,
      users: group_created.users,
    };

    return res.status(200).json({
      success: true,
      message: "Group created successfully",
      group: group_info,
    });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
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

    const groups = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        groups: {
          orderBy: { createdAt: "desc" },
          where: { type: "course" },
          include: {
            users: true,
            _count: {
              select: {
                users: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({ success: true, message: groups.groups });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getNonCourseGroupsByUser: RequestHandler = async (
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
        .json({ success: false, message: "User not found" });
    }

    const groups = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        groups: {
          orderBy: { createdAt: "desc" },
          where: { type: "non-course" },
          include: {
            users: true,
          },
        },
      },
    });

    const groups_: Array<any> = groups.groups;

    const filteredGroups: Array<any> = [];

    for (let group of groups_) {
      // const messages = await Message.find({
      //   groupId: group.id,
      // })
      //   .sort({ timeStamp: -1 })
      //   .limit(1);

      const group_data = {
        id: group.id,
        name: group.name,
        image: group.image,
        admins: group.admins,
        college: group.college,
        description: group.description,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        recent_message:
          // messages.length > 0
          //   ? messages[0].type === "text"
          //     ? messages[0].message
          //     : messages[0].type
          //   : "No messages",
          "Loading...",
        theme: group.theme,
        type: group.type,
        // sender: messages.length > 0 ? messages[0].sender : null,
        sender: "",
        users: group.users,
      };
      filteredGroups.push(group_data);
    }

    return res.status(200).json({ success: true, message: filteredGroups });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
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
        .json({ success: false, message: "Something went wrong" });
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
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const groups: string = await redisClient.get(`total_client_groups`);

    if (groups) {
      const groups_: Array<Group2> = JSON.parse(groups);

      return res.status(200).json({ success: true, message: groups_ });
    } else {
      const groups = await prisma.group.findMany({
        orderBy: {
          createdAt: "desc",
        },
        where: {
          type: "non-course",
        },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      });

      await redisClient.setEx(
        "total_client_groups",
        1800,
        JSON.stringify(groups)
      );

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

    const groups: string = await redisClient.get("total_client_groups");

    if (groups && group.type === "non-course") {
      const groups_: Array<Group2> = JSON.parse(groups);

      const group_element: Group2 = groups_.find(
        (element) => element.id === group.id
      );

      if (group_element) {
        const index = groups_.indexOf(group_element);
        group_element._count.users = group_element._count.users + 1;
        groups_[index] = group_element;
      }

      await redisClient.setEx(
        "total_client_groups",
        1800,
        JSON.stringify(groups_)
      );
    }

    const recent_groups: string = await redisClient.get("recent-groups");

    if (recent_groups && group.type == "non-course") {
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

    let group_joined = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        users: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (io) {
      io.emit("group-join", { group_id: group_id, user: user });
    }

    if (group_joined.type === "course") {
      return res.status(200).json({
        success: true,
        message: "Group joined successfully",
        group: group_joined,
      });
    } else {
      const messages = await Message.find({
        groupId: group_joined.id,
      })
        .sort({ timeStamp: -1 })
        .limit(1);

      const group_info = {
        id: group_joined.id,
        name: group_joined.name,
        image: group_joined.image,
        admins: group_joined.admins,
        college: group_joined.college,
        description: group_joined.description,
        createdAt: group_joined.createdAt,
        updatedAt: group_joined.updatedAt,
        recent_message:
          messages.length > 0 ? messages[0].message : "No messages",
        theme: group_joined.theme,
        type: group_joined.type,
        sender: messages.length > 0 ? user.name : null,
        users: group_joined.users,
      };
      return res.status(200).json({
        success: true,
        message: "Group joined successfully",
        group: group_info,
      });
    }
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
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
        .json({ success: false, message: "Something went wrong" });
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

    const totalGroups = groups.groups.length;

    return res.status(200).json({
      success: true,
      message: user,
      totalGroups: totalGroups,
    });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getUserAssistantName: RequestHandler = async (
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
        .json({ success: false, message: "User not found" });
    }

    const assistant = await prisma.assistant.findFirst({
      where: { user_id: user.id },
    });

    if (!assistant) {
      return res
        .status(400)
        .json({ success: false, message: "No any assistant found" });
    }

    return res.status(200).json({
      success: true,
      message: assistant.chatbotName,
      name: assistant.name,
      profile: user.image,
      assistantId: assistant.id,
    });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getGroupAssistantName: RequestHandler = async (
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
        message: "Group with this id does not exists",
      });
    }

    const assistant = await prisma.assistant.findFirst({
      where: { group_id: group.id },
    });

    if (!assistant) {
      return res
        .status(400)
        .json({ success: false, message: "No any assistant found" });
    }

    return res.status(200).json({ success: true, message: assistant });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
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
      profile_image,
    }: {
      name: string;
      college: string;
      courses: string;
      year: string;
      major: string;
      profile_image: string;
    } = req.body;

    if (
      !name.trim() ||
      !college.trim() ||
      !courses.trim() ||
      !year.trim() ||
      !major.trim() ||
      !profile_image.trim()
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
        image: profile_image,
        isbioDataUpdated: true,
      },
    });

    if (io) {
      io.emit("profile-change", { user: user, profile_pic: profile_image });
    }

    return res
      .status(200)
      .json({ success: true, message: "User profile updated successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong." });
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
        .json({ success: false, message: "Something went wrong" });
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
        .json({ success: false, message: "Something went wrong" });
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

    const totalGroups = groups.groups.length;

    return res.status(200).json({
      success: true,
      message: user,
      groups: groups,
      totalGroups: totalGroups,
    });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong." });
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

    const groups: string = await redisClient.get("total_client_groups");

    if (groups && group.type === "non-course") {
      const groups_: Array<Group2> = JSON.parse(groups);

      const group_element: Group2 = groups_.find(
        (element) => element.id === group.id
      );

      if (group_element) {
        const index = groups_.indexOf(group_element);
        group_element._count.users = group_element._count.users - 1;
        groups_[index] = group_element;
      }

      await redisClient.setEx(
        "total_client_groups",
        1800,
        JSON.stringify(groups_)
      );
    }

    const recent_groups: string = await redisClient.get("recent-groups");

    if (recent_groups && group.type === "non-course") {
      const groups_: Array<Group2> = JSON.parse(recent_groups);

      const group_element: Group2 = groups_.find(
        (element) => element.id === group.id
      );

      if (group_element) {
        const index = groups_.indexOf(group_element);
        group_element._count.users = group_element._count.users - 1;
        groups_[index] = group_element;
      }

      await redisClient.setEx("recent-groups", 1800, JSON.stringify(groups_));
    }

    if (io) {
      io.emit("group-leave", { group_id: group_id, user: user });
    }

    return res
      .status(200)
      .json({ success: false, message: "You left the group" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong." });
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
        .json({ success: false, message: "Something went wrong." });
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
          type: "non-course",
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

export const createFlashCards: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      questions,
      answers,
    }: {
      name: string;
      questions: string[];
      answers: string[];
    } = req.body;

    if (!name.trim() || questions.length <= 0 || answers.length <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please complete the form" });
    }

    const { group_id } = req.params;

    const group = await prisma.group.findFirst({
      where: { id: parseInt(group_id) },
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    await prisma.flashCard.create({
      data: {
        name: name,
        questions: questions,
        answers: answers,
        group_id: group.id,
        creator: user.name,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "FlashCard created successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getFlashCards: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { group_id } = req.params;

    const group = await prisma.group.findFirst({
      where: { id: parseInt(group_id) },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group with the given id does not exists",
      });
    }

    const flashcards = await prisma.flashCard.findMany({
      where: { group_id: group.id },
    });

    return res.status(200).json({ success: true, message: flashcards });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getFlashCard: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { flashcard_id } = req.params;

    const flashcard = await prisma.flashCard.findFirst({
      where: { id: parseInt(flashcard_id) },
    });

    if (!flashcard) {
      return res
        .status(404)
        .json({ success: false, message: "Flashcard not found" });
    }

    return res.status(200).json({ success: true, message: flashcard });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const updateProfileDataOnSignUp: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      college,
      name,
      token,
    }: {
      college: string;
      token: string;
      name: string;
    } = req.body;

    if (!college.trim() || !name.trim() || !token.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

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
        college: college,
        isbioDataUpdated: true,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "User profile updated successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const syncGroupDetailsDataWhenOffline: RequestHandler = async (
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
        .json({ success: false, message: "User not found" });
    }

    const groups = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        groups: {
          orderBy: { createdAt: "desc" },
          include: {
            users: true,
          },
        },
      },
    });

    return res.status(200).json({ success: true, message: groups.groups });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const deleteAccount: RequestHandler = async (
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
        .json({ success: false, message: "User not found" });
    }

    await prisma.user.delete({ where: { id: user.id } });

    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const blockUser: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { blocked_username }: { blocked_username: string } = req.body;

    if (!blocked_username.trim()) {
      return res
        .status(400)
        .json({ success: true, message: "Please provide valid inputs" });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const blocked_user = await prisma.user.findFirst({
      where: { username: blocked_username },
    });

    if (!blocked_user) {
      return res.status(404).json({ success: true, message: "User not found" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { blocked_users: [...user.blocked_users, blocked_username] },
    });

    return res
      .status(200)
      .json({ success: true, message: "User blocked successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const getLatestVersion: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const app_latest_version = process.env.COURSEX_LATEST_VERSION;

    return res.status(200).json({ success: true, message: app_latest_version });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};
