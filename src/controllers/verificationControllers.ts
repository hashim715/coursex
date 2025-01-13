import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../config/postgres";
import crypto from "crypto";
import { client } from "../utils/sendEmail";
import { sendToken } from "../utils/sendToken";
import { generateVerificationCode } from "../utils/getVerificationCode";
import { validateEmail } from "../utils/checkvalidemail";
import bcrypt from "bcrypt";
// import nodemailer from "nodemailer";
// import { google } from "googleapis";

export const verifyEmail: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, email }: { code: string; email: string } = req.body;

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

    await client.sendEmail({
      From: process.env.EMAIL_FROM,
      To: email,
      Subject: "Verify your Email",
      TextBody: `<h1>Your email verified successfully</h1>`,
    });

    await prisma.user.update({
      where: { email: email },
      data: {
        isUserVerified: true,
        verification_token: null,
        verification_secret: null,
        verification_token_expiry: null,
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

export const verifyForgotPasswordEmail: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, email }: { code: string; email: string } = req.body;

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
      .update(code + user.forgotpassword_secret)
      .digest("hex");

    if (user.forgotpassword_token !== verification_token) {
      return res
        .status(400)
        .json({ success: false, message: "Code did not match" });
    }

    if (Date.now() > new Date(user.forgotpassword_token_expiry).getTime()) {
      return res.status(400).json({
        success: false,
        message: "Your verification token is expired not valid",
      });
    }

    await prisma.user.update({
      where: { email: email },
      data: {
        resetPasswordVerification: true,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.log(err);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const sendVerificationCodeforForgotPassword: RequestHandler = async (
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
        forgotpassword_secret: token,
        forgotpassword_token: verificationToken,
        forgotpassword_token_expiry: next24Hours.toISOString(),
      },
    });

    await client.sendEmail({
      From: process.env.EMAIL_FROM,
      To: email,
      Subject: "Verify your Email",
      TextBody: `
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
          <h1 style="text-align: center; color: #4CAF50;">Verify Your Email</h1>
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">To complete your password changing, please verify your email address by using the verification code below:</p>
          <h2 style="font-size: 24px; font-weight: bold; color: #333; text-align: center;">${code}</h2>
          <p style="font-size: 16px;">Alternatively, click on the link below to verify your email:</p>
          <p style="text-align: center;">
            <a href="https://coursex.us/app/verification/${email}/forgot" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </p>
          <p style="font-size: 14px; color: #777;">If you did not request this verification, please ignore this email.</p>
        </div>
      </body>
    </html>
  `,
    });

    return res
      .status(200)
      .json({ success: true, message: "Verification Email sent successfully" });
  } catch (err) {
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

export const sendVerifiCationCode: RequestHandler = async (
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

    await client.sendEmail({
      From: process.env.EMAIL_FROM,
      To: email,
      Subject: "Verify your Email",
      TextBody: `
        <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
          <h1 style="text-align: center; color: #4CAF50;">Verify Your Email</h1>
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 16px;">Thank you for registering. To complete your the registration, please verify your email address by using the verification code below:</p>
          <h2 style="font-size: 24px; font-weight: bold; color: #333; text-align: center;">${code}</h2>
          <p style="font-size: 16px;">Alternatively, click on the link below to verify your email:</p>
          <p style="text-align: center;">
            <a href="https://coursex.us/app/verification/${email}/verify" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </p>
          <p style="font-size: 14px; color: #777;">If you did not request this verification, please ignore this email.</p>
        </div>
      </body>
    </html>
      `,
    });

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

export const forgotPassword: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { password, email }: { password: string; email: string } = req.body;

    if (!password.trim() || !email.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide valid inputs" });
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

    const user = await prisma.user.findFirst({ where: { email: email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exists",
      });
    }

    if (!user.resetPasswordVerification || !user.isUserVerified) {
      return res
        .status(400)
        .json({ success: false, message: "User is not verified" });
    }

    const salt: string = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { email: email },
      data: {
        password: password,
        resetPasswordVerification: false,
        forgotpassword_token: null,
        forgotpassword_secret: null,
        forgotpassword_token_expiry: null,
      },
    });

    await client.sendEmail({
      From: process.env.EMAIL_FROM,
      To: email,
      Subject: "Password Reset",
      HtmlBody: `<h1>Your password is reset</h1>`,
    });

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
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
    // const oauth2Client = new google.auth.OAuth2(
    //   "YOUR_CLIENT_ID",
    //   "YOUR_CLIENT_SECRET",
    //   "https://login.microsoftonline.com/common/oauth2/nativeclient"
    // );

    // const { token } = await oauth2Client.getAccessToken();

    // console.log(token);

    // let transporter = nodemailer.createTransport({
    //   service: "Outlook365",
    //   auth: {
    //     type: "OAuth2",
    //     user: "your-email@outlook.com",
    //     clientId: "YOUR_CLIENT_ID",
    //     clientSecret: "YOUR_CLIENT_SECRET",
    //     refreshToken: "YOUR_REFRESH_TOKEN",
    //     accessToken: token, // Access token generated
    //   },
    // });

    // let info = await transporter.sendMail({
    //   from: '"Your Name" <your-email@outlook.com>',
    //   to: "recipient@example.com",
    //   subject: "Hello",
    //   text: "Hello world!",
    //   html: "<b>Hello world!</b>",
    // });

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
