import {
  getMessagesByGroup,
  updateReadStatusOnConnection,
  syncUserMetadataForAllGroups,
  syncUserMessagesForaSingleGroup,
} from "../controllers/chatController";
import express from "express";
import { Router } from "express";
import { protect } from "../middleware/auth";

export const chatRouter: Router = express.Router();

chatRouter
  .route("/getMessagesByGroup/:group_id")
  .get(protect, getMessagesByGroup);

chatRouter
  .route("/updateMessageStatus/:group_id")
  .get(protect, updateReadStatusOnConnection);

chatRouter
  .route("/syncUserMetaDataForAllGroups")
  .get(protect, syncUserMetadataForAllGroups);

chatRouter
  .route("/syncMessagesForSingleGroup/:group_id")
  .get(protect, syncUserMessagesForaSingleGroup);
