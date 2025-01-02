import { Router } from "express";
import express from "express";
import { testNofication } from "../controllers/notificationController";

export const notificationRouter: Router = express.Router();

notificationRouter.route("/sendNotification").get(testNofication);
