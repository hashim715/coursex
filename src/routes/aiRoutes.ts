import { Router } from "express";
import express from "express";
import {
  searchTheweb,
  chatWithGemini,
  getYouTubeSummary,
  getWebPageSummary,
  getDocumentSummary,
  addDocument,
  getDocuments,
} from "../controllers/aiController";
import { protect } from "../middleware/auth";

export const aiRouter: Router = express.Router();

aiRouter.route("/searchTheWeb").post(searchTheweb);
aiRouter.route("/chatWithGemini").post(chatWithGemini);
aiRouter.route("/getYoutubeSummary").post(protect, getYouTubeSummary);
aiRouter.route("/getWebPageSummary").post(protect, getWebPageSummary);
aiRouter.route("/getDocumentSummary").post(protect, getDocumentSummary);
aiRouter.route("/createDocument").post(protect, addDocument);
aiRouter.route("/getDocuments").get(protect, getDocuments);
