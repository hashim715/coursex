import express from "express";
import { Router } from "express";
import {
  testSendingEmail,
  verifyEmail,
} from "../controllers/verificationControllers";
import { protect } from "../middleware/auth";

export const verificationRouter: Router = express.Router();

verificationRouter.route("/sendEmail").get(testSendingEmail);
verificationRouter.route("/verifyEmail").post(protect, verifyEmail);
