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
import QRCode from "qrcode";

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  password: string;
  year: string;
  college: string | null;
  image: string | null;
  courses: string[];
  createdAt: Date;
  updatedAt: Date;
  token: string | null;
};

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

    await sendToken(username, 201, res);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    const isMatch = await matchPassword(password, user.password);
    if (!isMatch) {
      return res
        .status(404)
        .json({ success: false, message: "Password did not match" });
    }
    await sendToken(user.username, 200, res);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};

export const createGroup: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    const { name, college, description } = req.body;

    if (!name.trim() || !college.trim() || !description.trim()) {
      clearfiles(req.files);
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      clearfiles(req.files);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const fileTypes = /jpeg|jpg|png|gif/;
    let filename: string | null;
    let imageUrl: string | null;

    if (Array.isArray(req.files)) {
      const file = req.files[0];
      const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = fileTypes.test(file.mimetype);
      if (!extname || !mimetype) {
        clearfiles(req.files);
        return res.status(400).json({
          success: false,
          message: "Invalid file format. Only JPEG, PNG, and GIF are allowed.",
        });
      }

      const date = Date.now();
      filename = "uploads/groups/" + date + req.files[0].originalname;
      renameSync(req.files[0].path, filename);

      const fileContent = fs.readFileSync(filename);

      const params = {
        Bucket: "w-groupchat-images",
        Key: `${Date.now()}_${file.originalname}`,
        Body: fileContent,
        ContentType: "image/jpeg",
        //ACL: 'public-read',
      };

      const s3Response = await s3.upload(params).promise();
      imageUrl = s3Response.Location;
    } else if (req.files && req.files["image"]) {
      const file = req.files["image"][0];
      const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = fileTypes.test(file.mimetype);
      if (!extname || !mimetype) {
        clearfiles(req.files);
        return res.status(400).json({
          success: false,
          message: "Invalid file format. Only JPEG, PNG, and GIF are allowed.",
        });
      }

      const date = Date.now();
      filename = "uploads/groups/" + date + req.files["image"][0].originalname;
      renameSync(req.files["image"][0].path, filename);

      const fileContent = fs.readFileSync(filename);

      const params = {
        Bucket: "w-groupchat-images",
        Key: `${Date.now()}_${file.originalname}`,
        Body: fileContent,
        ContentType: "image/jpeg",
        //ACL: 'public-read',
      };

      const s3Response = await s3.upload(params).promise();
      imageUrl = s3Response.Location;
    }

    let group;

    if (filename && imageUrl) {
      group = await prisma.group.create({
        data: {
          name: name,
          college: college,
          description: description,
          admins: [user.id],
          image: imageUrl,
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

    if (filename) {
      fs.unlinkSync(filename);
    }

    return res
      .status(200)
      .json({ success: true, message: "Group created successfully" });
  } catch (err) {
    console.log(err);
    clearfiles(req.files);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
      select: { groups: true },
    });

    return res.status(200).json({ success: true, message: groups.groups });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};

export const getGroups = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const groups = await prisma.group.findMany({});

    return res.status(200).json({ success: true, message: groups });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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

    return res
      .status(200)
      .json({ success: true, message: "User joined successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};

export const editProfileInfo: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response> => {
  try {
    let {
      name,
      college,
      courses,
    }: { name: string; college: string; courses: string } = req.body;

    if (!name || !college || !courses) {
      clearfiles(req.files);
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    if (!name.trim() || !college.trim() || !courses.trim()) {
      clearfiles(req.files);
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
    }

    const courses_: Array<string> = JSON.parse(courses);

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    if (!user) {
      clearfiles(req.files);
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const fileTypes = /jpeg|jpg|png|gif/;
    let filename: string | null;
    let imageUrl: string | null;

    if (Array.isArray(req.files)) {
      const file = req.files[0];
      const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = fileTypes.test(file.mimetype);
      if (!extname || !mimetype) {
        clearfiles(req.files);
        return res.status(400).json({
          success: false,
          message: "Invalid file format. Only JPEG, PNG, and GIF are allowed.",
        });
      }

      const date = Date.now();
      filename = "uploads/profile/" + date + req.files[0].originalname;
      renameSync(req.files[0].path, filename);

      const fileContent = fs.readFileSync(filename);

      const params = {
        Bucket: "w-groupchat-images",
        Key: `${Date.now()}_${file.originalname}`,
        Body: fileContent,
        ContentType: "image/jpeg",
      };

      await deleteImageByUrl(user.image, "w-groupchat-images");

      const s3Response = await s3.upload(params).promise();
      imageUrl = s3Response.Location;
    } else if (req.files && req.files["image"]) {
      const file = req.files["image"][0];
      const extname = fileTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype = fileTypes.test(file.mimetype);
      if (!extname || !mimetype) {
        clearfiles(req.files);
        return res.status(400).json({
          success: false,
          message: "Invalid file format. Only JPEG, PNG, and GIF are allowed.",
        });
      }

      const date = Date.now();
      filename = "uploads/profile/" + date + req.files["image"][0].originalname;
      renameSync(req.files["image"][0].path, filename);

      const fileContent = fs.readFileSync(filename);

      const params = {
        Bucket: "w-groupchat-images",
        Key: `${Date.now()}_${file.originalname}`,
        Body: fileContent,
        ContentType: "image/jpeg",
      };

      await deleteImageByUrl(user.image, "w-groupchat-images");

      const s3Response = await s3.upload(params).promise();
      imageUrl = s3Response.Location;
    }

    if (filename && imageUrl) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name,
          courses: courses_,
          college: college,
          image: imageUrl,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name,
          courses: courses_,
          college: college,
        },
      });
    }

    if (filename) {
      fs.unlinkSync(filename);
    }

    return res
      .status(200)
      .json({ success: true, message: "User profile updated successfully" });
  } catch (err) {
    console.log(err);
    clearfiles(req.files);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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

    return res
      .status(200)
      .json({ success: false, message: "You left the group" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    }: {
      name: string;
      location: string;
      description: string;
      startTime: string;
      endTime: string;
    } = req.body;

    if (
      !name.trim() ||
      !location.trim() ||
      !description.trim() ||
      !startTime.trim() ||
      !endTime.trim()
    ) {
      clearfiles(req.files);
      return res.status(400).json({
        success: false,
        message: "Please fill out the form correctly",
      });
    }

    const token = getTokenFunc(req);

    const { username }: { username: string } = jwt_decode(token);

    const user = await prisma.user.findFirst({ where: { username: username } });

    const files_ = req.files as { [fieldname: string]: Express.Multer.File[] };
    const files: Express.Multer.File[] = files_["image"];

    const fileTypes = /jpeg|jpg|png|gif/;

    let imageUrl: string;

    if (Array.isArray(files)) {
      for (const file of files) {
        const extname = fileTypes.test(
          path.extname(file.originalname).toLowerCase()
        );
        const mimetype = fileTypes.test(file.mimetype);

        if (!extname || !mimetype) {
          clearfiles(req.files);
          return res.status(400).json({
            success: false,
            message:
              "Invalid file format. Only JPEG, PNG, and GIF are allowed.",
          });
        }

        const date = Date.now();
        const filename = "uploads/events/" + date + file.originalname;
        renameSync(file.path, filename);

        const fileContent = fs.readFileSync(filename);

        const params = {
          Bucket: "w-groupchat-images",
          Key: `${Date.now()}_${file.originalname}`,
          Body: fileContent,
          ContentType: "image/jpeg",
        };

        try {
          const s3Response = await s3.upload(params).promise();
          imageUrl = s3Response.Location;
          fs.unlinkSync(filename);
        } catch (error) {
          clearfiles(req.files);
          return res.status(400).json({
            success: false,
            message: "Error while uploading images try again",
          });
        }
      }
    }

    if (imageUrl) {
      await prisma.event.create({
        data: {
          name: name,
          adminId: user.id,
          location: location,
          description: description,
          startTime: startTime,
          endTime: endTime,
          image: imageUrl,
        },
      });
    } else {
      await prisma.event.create({
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
    return res
      .status(200)
      .json({ success: true, message: "Your event creatd successfully." });
  } catch (err) {
    clearfiles(req.files);
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
  }
};

export const getEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await prisma.event.findMany({});

    return res.status(200).json({ success: true, message: events });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Server error occurred" });
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
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
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
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
