import express from "express";
import { Router } from "express";
import {
  testSendingEmail,
  tesitingsendVerificationCodeToPhoneNumber,
  verifyEmailOnRegister,
  sendVerifiCationCodeToEmail,
  sendVerificationCodeToPhoneNumber,
  verifyPhoneNumberOnRegister,
  verifyPhoneNumberOnLogin,
  verifyEmailOnLogin,
  redirectUri,
} from "../controllers/verificationControllers";

export const verificationRouter: Router = express.Router();

verificationRouter.route("/redirect").get(redirectUri);
verificationRouter.route("/sendEmail").get(testSendingEmail);
verificationRouter
  .route("/testingSendSMS")
  .get(tesitingsendVerificationCodeToPhoneNumber);

verificationRouter.route("/verifyEmailOnRegister").post(verifyEmailOnRegister);
verificationRouter.route("/verifyEmailOnLogin").post(verifyEmailOnLogin);

verificationRouter
  .route("/sendVerificationEmail")
  .post(sendVerifiCationCodeToEmail);
verificationRouter
  .route("/sendVerificationSMS")
  .post(sendVerificationCodeToPhoneNumber);

verificationRouter
  .route("/verifyPhoneNumberOnRegister")
  .post(verifyPhoneNumberOnRegister);
verificationRouter
  .route("/verifyPhoneNumberOnLogin")
  .post(verifyPhoneNumberOnLogin);
