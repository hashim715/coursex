import { Router } from "express";
import express from "express";
import {
  testNofication,
  refreshNotificationToken,
} from "../controllers/notificationController";
import { protect } from "../middleware/auth";

export const notificationRouter: Router = express.Router();

notificationRouter.route("/sendNotification").get(testNofication);

notificationRouter
  .route("/refreshNotification")
  .post(protect, refreshNotificationToken);
