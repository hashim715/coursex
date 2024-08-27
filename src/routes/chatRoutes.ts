import {
  getMessagesByGroup,
  updateDeliverStatusOnConnection,
} from "../controllers/chatController";
import express from "express";
import { Router } from "express";
import { protect } from "../middleware/auth";
import multer from "multer";

export const chatRouter: Router = express.Router();

const uploadUserImages = multer({
  dest: "uploads/userImages",
});

chatRouter
  .route("/getMessagesByGroup/:group_id")
  .get(protect, getMessagesByGroup);

chatRouter
  .route("/updatedeliverstatus")
  .get(protect, updateDeliverStatusOnConnection);
