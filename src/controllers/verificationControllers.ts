import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../config/postgres";
import crypto from "crypto";
import { email_transporter } from "../utils/sendEmail";
import { twilio_client } from "../utils/twilioClient";
import { sendToken } from "../utils/sendToken";
import { generateVerificationCode } from "../utils/getVerificationCode";
import { validateEmail } from "../utils/checkvalidemail";
import { validatePhoneNumber } from "../utils/validatePhoneNumber";
import nodemailer from "nodemailer";
import axios from "axios";

const getToken = async () => {
  try {
    const response = await axios.post(
      "https://login.microsoftonline.com/4b6ea646-aa76-44a9-b5d3-caebf4153556/oauth2/v2.0/token",
      new URLSearchParams({
        client_id: "9515492b-8800-445a-a4aa-6df4b6684ead",
        scope: "offline_access Mail.Send",
        code: "1.AWEBRqZuS3aqqUS108rr9BU1VitJFZUAiFpEpKpt9LZoTq1iAQBhAQ.AgABBAIAAABVrSpeuWamRam2jAF1XRQEAwDs_wUA9P-L_BDj8LQhD_TxDg9LNCf7yXKSQr2mjBWM6vgA78H2f3-a9Mq3ztCtAGBoQ_IrcszCS3ajeMR59aZhde85HB03C5CvAv64NLxrmAQcnwqRrgWn6olVwlnoblK2lMXH3LQA7M1Gnt5fbcfze_TrHAls5utR2sxQV-MoVllty671Jqrm2hrcGbbH0LI3wVoLiQNS7s4kzHKfRpCV2O542CIWLj61Tb5izIE2DWKgJOjHXavcXxQyNgEfO84bWVCNake6cqmGiq9vvZuP7WXTzuB-ueodGrrFqDCvrpRuHMv61GkrwGhsefnnZeFpsL59WhFCs8dc2rPDCLdyTh7-EtqH5TcGponuMXNc5ZIy05b-kFCr39_dplujLkQh7SFiOTSsl4LPzTgDvXJ6TOw_f0DUUgdNpqp5_yMOQnuN4-i9VFZOSw-f4dIBaF0lgc3alRJ51ozFLGxNvwDXaeP5VvS5lOvNlrOLBdeAOrBsMeKRshBmXHNuVkHiVvkDXJcBEHs30COjaoUzzpal346a7_FnRzQU1nWl2xkDECKSphmSqULz3BIVTbTcd1OusVHr56AuDuYbYww6TXdirQd-uG5fVbom6r-hwBU0MtELoMGzRwTS9gy80PG1J-7ii7TKRZ-GOCW0AeYLm94O7HdxBE5QUuaVoEhtyqkTdujfgWT2g7MJrxCrMrKsynXrfAGEveSF2MfwakGa-fSg4rdvZiyPkOmA9ItRIKJq99OjxgiPqPPJj280_xRRCiJJmUBdLxboN9SFAYLU2erlw99vU-YXYA90PjTBBWX98fRiIFgOwe6fO-T8T-NF6HW2KbdgyZ0_eN2phm9Yz5-zsZnjqzaQVzkeZVKHn6HmPO0-CyUvWs3UtCWgHlUdpwFDmHGT_dILA5jMd3Rdnn6V3VQxm27_8epShSinlHP1CjbiwU58kuYjexnYEqtXfapf5w0_Ac04ptWxjIcHtfoWfbDRnFG3RPLQLW8HlkO9gsbSjxBgWs21fNoyLTMSKcaAMsk",
        redirect_uri: "http://localhost:5000/api/verify/redirect",
        grant_type: "authorization_code",
        client_secret: "Wyx8Q~f5G0T8kJ_ea~kU58HbIK3gAhkQOg0VLddB",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Access Token Response:", response.data);
  } catch (error) {
    console.error(
      "Error fetching access token:",
      error.response?.data || error.message
    );
  }
};

export const verifyEmailOnRegister: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      code,
      email,
      notificationToken,
    }: { code: string; email: string; notificationToken: string | null } =
      req.body;

    if (!code.trim() || !email.trim() || code.length < 6) {
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

    const user = await prisma.user.findFirst({ where: { email: email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    const verification_token = crypto
      .createHash("sha256")
      .update(code + user.verification_secret)
      .digest("hex");

    if (user.verification_token !== verification_token) {
      return res
        .status(400)
        .json({ success: false, message: "Code did not match" });
    }

    if (Date.now() > new Date(user.verification_token_expiry).getTime()) {
      return res.status(400).json({
        success: false,
        message: "Your verification token is expired not valid",
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Hello from CourseX",
      text: "Verify your Email",
      html: `<h1>Your email verified successfully</h1>`,
    };

    await email_transporter.sendMail(mailOptions);

    await prisma.user.update({
      where: { email: email },
      data: {
        isUserRegistered: true,
        verification_token: null,
        verification_secret: null,
        verification_token_expiry: null,
        deviceToken: notificationToken,
      },
    });

    await sendToken(user.username, 200, res);
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const verifyEmailOnLogin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      code,
      email,
      notificationToken,
    }: { code: string; email: string; notificationToken: string | null } =
      req.body;

    if (!code.trim() || !email.trim() || code.length < 6) {
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

    const user = await prisma.user.findFirst({ where: { email: email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    if (!user.isUserRegistered) {
      return res
        .status(400)
        .json({ success: false, message: "User is not verified" });
    }

    const verification_token = crypto
      .createHash("sha256")
      .update(code + user.verification_secret)
      .digest("hex");

    if (user.verification_token !== verification_token) {
      return res
        .status(400)
        .json({ success: false, message: "Code did not match" });
    }

    if (Date.now() > new Date(user.verification_token_expiry).getTime()) {
      return res.status(400).json({
        success: false,
        message: "Your verification token is expired not valid",
      });
    }

    await prisma.user.update({
      where: { email: email },
      data: {
        verification_token: null,
        verification_secret: null,
        verification_token_expiry: null,
        deviceToken: notificationToken,
      },
    });

    await sendToken(user.username, 200, res);
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const verifyPhoneNumberOnRegister: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      code,
      phone_number,
      notificationToken,
    }: {
      code: string;
      phone_number: string;
      notificationToken: string | null;
    } = req.body;

    if (!code.trim() || !phone_number.trim() || code.length < 6) {
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

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    const verification_token = crypto
      .createHash("sha256")
      .update(code + user.phonenumber_secret)
      .digest("hex");

    if (user.phonenumber_token !== verification_token) {
      return res
        .status(400)
        .json({ success: false, message: "Code did not match" });
    }

    if (Date.now() > new Date(user.phonenumber_token_expiry).getTime()) {
      return res.status(400).json({
        success: false,
        message: "Your verification token is expired not valid",
      });
    }

    await prisma.user.update({
      where: { phone_number: phone_number },
      data: {
        isUserRegistered: true,
        phonenumber_token: null,
        phonenumber_secret: null,
        phonenumber_token_expiry: null,
        deviceToken: notificationToken,
      },
    });

    await sendToken(user.username, 200, res);
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const verifyPhoneNumberOnLogin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      code,
      phone_number,
      notificationToken,
    }: {
      code: string;
      phone_number: string;
      notificationToken: string | null;
    } = req.body;

    if (!code.trim() || !phone_number.trim() || code.length < 6) {
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

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    if (!user.isUserRegistered) {
      return res
        .status(400)
        .json({ success: false, message: "User is not verified" });
    }

    const verification_token = crypto
      .createHash("sha256")
      .update(code + user.phonenumber_secret)
      .digest("hex");

    if (user.phonenumber_token !== verification_token) {
      return res
        .status(400)
        .json({ success: false, message: "Code did not match" });
    }

    if (Date.now() > new Date(user.phonenumber_token_expiry).getTime()) {
      return res.status(400).json({
        success: false,
        message: "Your verification token is expired not valid",
      });
    }

    await prisma.user.update({
      where: { phone_number: phone_number },
      data: {
        phonenumber_token: null,
        phonenumber_secret: null,
        phonenumber_token_expiry: null,
        deviceToken: notificationToken,
      },
    });

    await sendToken(user.username, 200, res);
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const sendVerifiCationCodeToEmail: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email }: { email: string } = req.body;

    if (!email.trim()) {
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

    const user = await prisma.user.findFirst({ where: { email: email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with given email does not exists",
      });
    }

    const { verificationToken, token, code } = generateVerificationCode();

    const currentDate = new Date();
    const next24Hours = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { email: email },
      data: {
        verification_secret: token,
        verification_token: verificationToken,
        verification_token_expiry: next24Hours.toISOString(),
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
      .json({ success: true, message: "Verification Email sent successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const redirectUri: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const credentials = req.query;
    console.log(credentials);

    return res.status(200).json({ success: true, message: "good to see you" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const testSendingEmail: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: "hashimmuhammad844@gmail.com",
      subject: "Hello from CourseX",
      text: "This is a test email sent using Nodemailer!",
      html: "<p>This is a test email sent using <b>Nodemailer</b>!</p>",
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.error("Error while sending email:", error);
      }
      console.log("Email sent successfully:", info.response);
    });

    return res.status(200).json({ success: true, message: "Email Sent" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const tesitingsendVerificationCodeToPhoneNumber: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const message = await twilio_client.messages.create({
      body: "Your code is 123445",
      from: process.env.TWILIO_ACCOUNT_PHONE_NUMBER,
      to: "+13463916054",
    });

    return res.status(200).json({ success: true, message: message });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const sendVerificationCodeToPhoneNumber: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone_number }: { phone_number: string } = req.body;

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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with given phone number does not exists",
      });
    }

    const { verificationToken, token, code } = generateVerificationCode();

    const currentDate = new Date();
    const next30Minutes = new Date(currentDate.getTime() + 30 * 60 * 1000);

    await prisma.user.update({
      where: { phone_number: phone_number },
      data: {
        phonenumber_secret: token,
        phonenumber_token: verificationToken,
        phonenumber_token_expiry: next30Minutes.toISOString(),
      },
    });

    const message = await twilio_client.messages.create({
      body: `Your otp verification code is ${code}`,
      from: process.env.TWILIO_ACCOUNT_PHONE_NUMBER,
      to: phone_number,
    });

    return res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};
