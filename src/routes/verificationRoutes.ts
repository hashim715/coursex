import express from "express";
import { Router } from "express";
import {
  testSendingEmail,
  verifyEmail,
  sendVerifiCationCode,
  forgotPassword,
  verifyForgotPasswordEmail,
} from "../controllers/verificationControllers";

export const verificationRouter: Router = express.Router();

verificationRouter.route("/sendEmail").get(testSendingEmail);
verificationRouter.route("/verifyEmail").post(verifyEmail);
verificationRouter.route("/forgotPassword").post(forgotPassword);
verificationRouter.route("/sendVerificationEmail").post(sendVerifiCationCode);
verificationRouter
  .route("/verifyForgotPasswordEmail")
  .post(verifyForgotPasswordEmail);
